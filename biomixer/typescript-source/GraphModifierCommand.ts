///<reference path="headers/require.d.ts" />

///<reference path="headers/d3.d.ts" />

///<amd-dependency path="UndoRedoBreadcrumbs" />
///<amd-dependency path="GraphView" />
///<amd-dependency path="ExpansionSets" />

import UndoRedoBreadcrumbs = require("./UndoRedoBreadcrumbs");
import GraphView = require("./GraphView");
import ExpansionSets = require("./ExpansionSets");


/**
 * This command allows for the addition of nodes (and undo and redo). Edges are not really
 * added and removed in the same sense, so there is no related class for edges at this time.
 * If they were, we'd would bundle edges to be added or removed with the nodes they were
 * added or removed with.
 */
export class GraphAddNodesCommand<N extends GraphView.BaseNode> implements UndoRedoBreadcrumbs.ICommand{
    
    static counter = 0;
    
    private id: string;
    
    private redidLast = true;
    
    constructor(
        public graph: GraphView.Graph<N>,
        public expansionSet: ExpansionSets.ExpansionSet<N>
        
    ){

    }
    
    getUniqueId(): string{
        if(undefined === this.id){
            this.id = this.expansionSet.id.internalId+"_"+(GraphAddNodesCommand.counter++);
        }
        return this.id;
    }
    
    getDisplayName(): string{
        return this.expansionSet.id.displayId;
    }
    
    // TODO This implies that nodes should be added to the graph only
    // via the ExpansionSet, so that the logic is the same when adding a node
    // as when redoing the addition of a set. Hmmm...
    executeRedo(): void{
        if(!this.redidLast){
            this.redidLast = true;
            this.graph.addNodes(this.expansionSet.nodes, this.expansionSet);
        } else {
            console.log("Trying to redo same command twice in a row");
        }
    }
    
    executeUndo(): void{
        if(this.redidLast){
            this.redidLast = false;
            this.graph.removeNodes(this.expansionSet.nodes);
        } else {
            console.log("Trying to undo same command twice in a row");
        }
    }
    
    preview(): void{
    
    }
}

export class GraphRemoveNodesCommand<N extends GraphView.BaseNode> implements UndoRedoBreadcrumbs.ICommand{
    
    // For node removal, we will want to generalize expansion sets, and collect adjacent node removals
    // into one set of removed nodes.
    constructor(
        public nodesToRemove: Array<N>
    ){

    }
    
    getUniqueId(): string{
        return "";
    }
    
    getDisplayName(): string{
        return "Removed Nodes";
    }
    
    executeRedo(): void{
    
    }
    
    executeUndo(): void{
    
    }
    
    preview(): void{
    
    }
}