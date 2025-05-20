import { idGenerator } from "./util.js";

const genID = idGenerator();

export class Tree {
    constructor() {
        this.id = genID.next().value;
        this.root = new Node();
    }

    *preOrderTraversal(node = this.root) {
        yield node;
        if (node.children.length) {
            for (let child of node.children) {
                yield* this.preOrderTraversal(child);
            }
        }
    }

    find(id) {
        for (let node of this.preOrderTraversal()) {
            if (node.id === id) return node;
        }
        return undefined;
    }
}

export class Node {
    constructor(parent = undefined) {
        this.id = genID.next().value;
        this.parent = parent;
        this.children = [];
        if (parent) {
            this.parent.addChild(this);
        }
    }

    addChild(node) {
        if (this.children.includes(node)) {
            return false;
        }
        this.children.push(node);

        if (node.parent) {
            return false;
        }
        return true;
    }

    removeChild(id) {
        const filtered = this.children.filter((c) => c.id !== id);

        if (filtered.length !== this.children.length) {
            this.children = filtered;
            return true;
        }

        return false;
    }
}
