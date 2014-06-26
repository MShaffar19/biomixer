///<reference path="headers/require.d.ts" />

///<reference path="headers/d3.d.ts" />

///<amd-dependency path="UndoRedoBreadcrumbs" />
///<amd-dependency path="GraphView" />
///<amd-dependency path="GraphModifierCommand" />

import UndoRedoBreadcrumbs = require("./UndoRedoBreadcrumbs");
import GraphView = require("./GraphView");
import GraphModifierCommand = require("./GraphModifierCommand");


/**
 * Expansion sets are a way of collecting together nodes that were loaded for a common
 * purpose; I would say at the same time, but loading is done with so much asynchonicity
 * that this would be inaccurate.
 * 
 * By collecting nodes loaded as cohorts, we can then filter them in and out, or use that
 * data to drive an undo-redo engine.
 * 
 * Other uses might arise. 
 */
export class ExpansionSet<N extends GraphView.BaseNode>{
    
    nodes: Array<N> = new Array<N>();
    
    graphModifier: GraphModifierCommand.GraphAddNodesCommand<N>;
    
    /**
     * Parent node can be null for the initial expansion, when the expansion is not triggered
     * by a menu on an existing node.
     */
    constructor(
        public id: ExpansionSetIdentifer,
        public parentNode: N,
        public graph: GraphView.Graph<N>
        ){
        if(null != parentNode){
            parentNode.expansionSetIdentifierAsMemberAsParent = id;
        }
        this.graphModifier = new GraphModifierCommand.GraphAddNodesCommand<N>(graph, this);
    }
    
    addAll(nodes: Array<N>): void{
        nodes.forEach(
            (node: N, i: number, arr: Array<N>)=>{
                if(node.expansionSetIdentifierAsMember !== undefined && node.expansionSetIdentifierAsMember !== this.id){
                    // The natural flow of the graph populating logic results in multiple passes, due to D3 idioms.
                    // The best place to add nodes to expansion sets are right as we are finally populating the graph
                    // with nodes from an expasions, so we will handle redundant expasion set additions here.
                    // Also, I want to know if there are attempts to add a node to multiple expansion sets.
                    // We don't want that, because it would complicate semantics, especially for undo-redo
                    // functionality that relies on expansion sets.
                    console.log("Attempted change of set expansion ID on node: "+this.id.displayId+", expansion ID "+node.getEntityId());
                } else if(node.expansionSetIdentifierAsMember !== undefined && node.expansionSetIdentifierAsMember === this.id){
                    // No need to set the id, and it should be in the node array already. I won't check.
                    // We might indeed try to add nodes to this again, due to the way that the undo/redo system is designed.
                } else {
                    node.expansionSetIdentifierAsMember = this.id;
                    this.nodes.push(node);
                }
            }
        );
    }
    
    getGraphModifier(){
        return this.graphModifier;
    }
    
}

export class ExpansionSetRegistry<N extends GraphView.BaseNode> {
    
    private registry: {[key: string]: ExpansionSet<N>} = {};
    
    constructor(
        private undoRedoBoss: UndoRedoBreadcrumbs.UndoRedoManager
        ){
    }
    
    /**
     * Parent node can be null for the initial expansion, when the expansion is not triggered
     * by a menu on an existing node.
     */
    createExpansionSet(id: ExpansionSetIdentifer, parentNode: N, graph: GraphView.Graph<N>): ExpansionSet<N> {
        this.registry[id.internalId] = new ExpansionSet<N>(id, parentNode, graph);
        this.undoRedoBoss.addCommand(this.registry[id.internalId].getGraphModifier());
        return this.registry[id.internalId];
    }
    
    findExpansionSet(id: ExpansionSetIdentifer): ExpansionSet<N>{
        return this.registry[id.internalId];
    }
    
    // TODO Do we really need or want edges in the set? Probably not.
    addToExpansionSet(nodes: Array<N>, id: ExpansionSetIdentifer): void{
        var expSet: ExpansionSet<N> = this.registry[id.internalId];
        expSet.addAll(nodes);
    }
    
    getAllExpansionSets(): {[key: string]: ExpansionSet<N>} {
        return this.registry;
    }
}

export class ExpansionSetIdentifer {
    // Only assign raw concept URI to this string
//    expansionSetIdentifer; // strengthen duck typing
    constructor(
        public internalId: string,
        public displayId: string
    ){
    }
}