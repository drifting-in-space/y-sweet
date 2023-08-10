import { ROOT_ID, buildTree } from "./ytree";

test('build empty tree', () => {
    let [tree, maxClock] = buildTree({})
    expect(maxClock).toBe(0)
    expect(tree.size).toBe(1)
    expect(tree.get(ROOT_ID)).toEqual({ parent: null, children: new Set() })
})

test('build tree with one node', () => {
    let [tree, maxClock] = buildTree({
        "abc123": {
            parent: {[ROOT_ID]: 1},
        }
    })
    expect(maxClock).toBe(1)
    expect(tree.size).toBe(2)
    expect(tree.get(ROOT_ID)).toEqual({ parent: null, children: new Set(["abc123"]) })
    expect(tree.get("abc123")).toEqual({ parent: ROOT_ID, children: new Set() })
})

test('build simple multi-node tree', () => {
    let [tree, maxClock] = buildTree({
        "child1": {
            parent: {[ROOT_ID]: 1},
        },
        "child2": {
            parent: {[ROOT_ID]: 2},
        },
        "grandchild1": {
            parent: {["child2"]: 3},
        }
    })
    expect(maxClock).toBe(3)
    expect(tree.size).toBe(4)
    expect(tree.get(ROOT_ID)).toEqual({ parent: null, children: new Set(["child1", "child2"]) })
    expect(tree.get("child1")).toEqual({ parent: ROOT_ID, children: new Set() })
    expect(tree.get("child2")).toEqual({ parent: ROOT_ID, children: new Set(["grandchild1"]) })
    expect(tree.get("grandchild1")).toEqual({ parent: "child2", children: new Set() })
})

test('simple conflict', () => {
    // Tree with two non-root nodes. The highest priority parent of both nodes is each other.

    let [tree, maxClock] = buildTree({
        "child1": {
            parent: {[ROOT_ID]: 2, "child2": 3},
        },
        "child2": {
            parent: {[ROOT_ID]: 1, "child1": 4},
        },
    })

    expect(maxClock).toBe(4)
    expect(tree.size).toBe(3)
    expect(tree.get(ROOT_ID)).toEqual({ parent: null, children: new Set(["child1"]) })
    expect(tree.get("child1")).toEqual({ parent: ROOT_ID, children: new Set(["child2"]) })
    expect(tree.get("child2")).toEqual({ parent: "child1", children: new Set() })
})
