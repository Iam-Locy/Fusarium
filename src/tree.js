import { idGenerator } from "./util.js";

const genID = idGenerator();

export class Tree {
    constructor(root = new Node()) {
        this.id = genID.next().value;
        this.root = root;
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
    constructor(pos) {
        this.id = genID.next().value;
        this.parent = undefined;
        this.children = [];
        this.pos = pos;
    }

    addChild(node) {
        if (this.children.includes(node)) {
            return false;
        }

        if (node.parent) {
            return false;
        }

        this.children.push(node);
        node.parent = this;

        return true;
    }

    removeChild(id) {
        const filtered = this.children.filter((c) => {
            if (c.id !== id) {
                return true;
            } else {
                c.parent = undefined;
                return false;
            }
        });

        if (filtered.length !== this.children.length) {
            this.children = filtered;
            return true;
        }

        return false;
    }
}
