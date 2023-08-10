import * as Y from 'yjs'
import { randomColor, randomString } from './util'
import { RadixPriorityQueueBuilder } from './radixpq'
import { ParentChain } from './parent_chain'

export const ROOT_ID = '__root'
const PARENT = 'parent'
const COLOR = 'color'

type NodeRelations = { parent: string | null; children: Set<string> }

function highestPriorityParent(map: Record<string, number>): [string | null, number] {
  let maxPriority = 0
  let maxParent = null
  Object.entries(map).forEach(([parent, priority]) => {
    if (priority > maxPriority) {
      maxPriority = priority
      maxParent = parent
    }
  })
  return [maxParent, maxPriority]
}

type JsonNode = {
  parent: {
    [key: string]: number
  },
  [key: string]: any
}

type JsonMap = {
  [key: string]: JsonNode
}

export function buildTree(map: JsonMap): [Map<string, NodeRelations>, number] {
  let maxClock = 0

  // First, parent any child that can be parented via the most recent entry.
  // This should usually cover the vast majority of nodes.

  // Map of node IDs to their parent and children.
  let rootedNodes = new Map<string, NodeRelations>()

  // The root node is special; it cannot be reparented.
  rootedNodes.set(ROOT_ID, { parent: null, children: new Set<string>() })

  // A map of node IDs that are detached from the root to their children.
  let unrootedNodes = new Map<string, ParentChain>()

  Object.entries(map).forEach(([id, node]) => {
    // Chain of unparented parents from the node we started at.
    // Only unparented parents are added to this list; as soon as we
    // find a parented node we parent the nodes to that parent in
    // the reverse order of this list.
    let parentChain = new ParentChain()

    while (!parentChain.hasCycle()) {
      if (unrootedNodes.has(id)) {
        return
      }

      parentChain.push(id)

      if (rootedNodes.has(id)) {
        // The parent is part of a chain to the root; go down the chain and parent.

        for (let [child, parent] of parentChain.childParentPairs()) {
          rootedNodes.get(parent)!.children.add(child)
          rootedNodes.set(child, { parent: id, children: new Set<string>() })
        }

        return
      }

      let [parent, priority] = highestPriorityParent(node[PARENT])
      maxClock = Math.max(maxClock, priority)

      if (!parent) {
        console.warn(`Ignoring node ${id} which has no parent.`, node)
        return
      }

      let tryNode: JsonNode | undefined
      if (parent !== ROOT_ID) {
        tryNode = map[parent]
        if (!tryNode) {
          console.warn(`Ignoring node ${parent} which does not exist.`)
          return
        }
      }

      id = parent
      node = tryNode!
    }

    for (let node of parentChain) {
      unrootedNodes.set(node, parentChain)
    }
  })

  // Now, parent the cycles.

  let queueBuilder = new RadixPriorityQueueBuilder<[string, string]>() // [child, parent]

  unrootedNodes.forEach((_, nodeId) => {
    let node = map[nodeId]!
    let parents: Record<string, number> = node[PARENT]
    for (let [parent, priority] of Object.entries(parents)) {
      queueBuilder.addEntry(priority, [nodeId, parent])
    }
  })

  let queue = queueBuilder.build()

  for (let [child, parent] of queue) {
    let parentChain = unrootedNodes.get(child)
    if (!parentChain) {
      // node has been parented
      console.log('node has been parented')
      continue
    }
    if (rootedNodes.has(parent)) {
      // node's parent has been parented, but node hasn't
      rootedNodes.get(parent)!.children.add(child)
      rootedNodes.set(child, { parent: parent, children: new Set<string>() })
      unrootedNodes.delete(child)

      // loop over children of node and parent them
      for (let [loopChild, loopParent] of parentChain.childParentPairsFrom(child)) {
        if (rootedNodes.has(loopChild)) {
          break // if this node is rooted, its children are too
        }

        rootedNodes.get(loopParent)!.children.add(loopChild)
        rootedNodes.set(loopChild, { parent: loopParent, children: new Set<string>() })
        unrootedNodes.delete(loopChild)
      }
    }
  }

  if (unrootedNodes.size > 0) {
    console.warn('Some nodes left unrooted!', unrootedNodes)
  }

  return [rootedNodes, maxClock]
}

export class YTree {
  // Map of parent id to map of child YTreeNodes. A null parent id means the root.
  structure: Map<string, NodeRelations> = new Map()
  maxClock: number = 0
  onChange?: () => void = () => { }

  constructor(public map: Y.Map<Y.Map<any>>) {
    this.map.observeDeep((e) => {
      this.updateChildren()
    })
    this.updateChildren()
  }

  setOnChange(onChange: () => void) {
    this.onChange = onChange
  }

  root() {
    return new YTreeNode(ROOT_ID, this)
  }

  updateChildren() {
    let map = this.map.toJSON()

    console.log('map', map)
    let [structure, maxClock] = buildTree(map)
    this.maxClock = maxClock
    console.log('structure', structure)

    this.structure = structure
    if (this.onChange) {
      this.onChange()
    }
  }
}

export class YTreeNode {
  constructor(
    private _id: string,
    public tree: YTree,
  ) { }

  id(): string {
    return this._id
  }

  color(): string {
    if (this._id === ROOT_ID) {
      return '#F2FF8C'
    } else {
      return this.tree.map.get(this._id)!.get(COLOR)
    }
  }

  children(): YTreeNode[] {
    return Array.from(this.tree.structure.get(this._id)?.children || []).map(
      (id) => new YTreeNode(id, this.tree),
    )
  }

  addChild(): YTreeNode {
    let map = new Y.Map()
    const id = randomString()
    const color = randomColor()
    let parentMap = new Y.Map()
    parentMap.set(this._id, ++this.tree.maxClock)
    map.set(PARENT, parentMap)
    map.set(COLOR, color)
    this.tree.map.set(id, map)
    return new YTreeNode(id, this.tree)
  }

  reparent(newParent: YTreeNode) {
    if (this._id === ROOT_ID) {
      console.error("Can't reparent root.")
      return
    }

    let oldParent = this.tree.structure.get(this._id)!.parent!

    if (newParent.id() === this._id) {
      return
    }

    // Detect if the new parent is a descendant of the new child.
    let probe = newParent.id()
    while (probe !== ROOT_ID) {
      let probeParent = this.tree.structure.get(probe)!.parent!
      if (probeParent === this._id) {
        this.tree.map.get(probe)!.get(PARENT).set(oldParent, ++this.tree.maxClock)
        break
      }
      probe = probeParent
    }

    this.tree.map.get(this._id)!.get(PARENT).set(newParent.id(), ++this.tree.maxClock)
  }
}
