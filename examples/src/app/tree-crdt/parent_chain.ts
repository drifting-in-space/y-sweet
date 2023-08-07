export class ParentChain {
  childToParent: Map<string, string> = new Map()
  parentToChild: Map<string, string> = new Map()
  _hasCycle: boolean = false
  lastParent: string | null = null

  constructor() {}

  has(value: string): boolean {
    return this.childToParent.has(value)
  }

  hasCycle(): boolean {
    return this._hasCycle
  }

  push(parent: string) {
    if (this._hasCycle) {
      throw new Error('Cannot push to a ParentChain once it has a cycle.')
    }

    if (this.childToParent.has(parent)) {
      // If we have already seen the parent node as a child, then we have a cycle.
      this._hasCycle = true
    }

    if (this.lastParent) {
      this.childToParent.set(this.lastParent, parent)
      this.parentToChild.set(parent, this.lastParent)
    }

    this.lastParent = parent
  }

  childParentPairs() {
    return this.childParentPairsFrom(this.lastParent)
  }

  childParentPairsFrom(parent: string | null) {
    return {
      [Symbol.iterator]: () => {
        return new ChildParentIterator(this, parent)
      },
    }
  }

  [Symbol.iterator](): IterableIterator<string> {
    return this.childToParent.values()[Symbol.iterator]()
  }
}

class ChildParentIterator {
  lastParent: string | null

  constructor(
    private chain: ParentChain,
    lastParent: string | null = null,
  ) {
    this.lastParent = lastParent
  }

  next(): { value: [string, string]; done: boolean } {
    if (this.lastParent) {
      let child = this.chain.parentToChild.get(this.lastParent)
      if (!child) {
        return { value: null as any, done: true }
      }

      let result: [string, string] = [child, this.lastParent]
      this.lastParent = child
      return { value: result, done: false }
    } else {
      return { value: null as any, done: true }
    }
  }
}
