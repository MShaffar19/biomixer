///<amd-dependency path="Utils" />
///<amd-dependency path="MouseSpinner" />
///<amd-dependency path="FetchFromApi" />
///<amd-dependency path="GraphView" />
///<amd-dependency path="LayoutProvider" />
///<amd-dependency path="ExpansionSets" />
///<amd-dependency path="Concepts/ExpansionManager" />
///<amd-dependency path="UndoRedo/UndoRedoManager" />
///<amd-dependency path="TipsyToolTipsOnClick" />
///<amd-dependency path="CompositeExpansionDeletionSet" />
///<amd-dependency path="Concepts/PropertyRelationsExpander" />

import Utils = require("../Utils");
import MouseSpinner = require("../MouseSpinner");
import Fetcher = require("../FetchFromApi");
import GraphView = require("../GraphView");
import LayoutProvider = require("../LayoutProvider");
import ExpansionSets = require("../ExpansionSets");
import ExpansionManager = require("./ExpansionManager");
import UndoRedoManager = require("../UndoRedo/UndoRedoManager");
import TipsyToolTipsOnClick = require("../TipsyToolTipsOnClick");
import CompositeExpansionDeletionSet = require("../CompositeExpansionDeletionSet");
import PropRel = require("./PropertyRelationsExpander");

declare var purl;

export interface PathOption extends UndoRedoManager.NodeInteraction {
    pathological; // strengthen duck typing
}


export class PathOptionConstants {
    // Tricky trick to allow casting of string up to PathOption. Fancy!
    static termNeighborhoodConstant: PathOption = <PathOption><any>"Term Neighborhood";
    static pathsToRootConstant: PathOption = <PathOption><any>"Path to Root";
    static mappingsNeighborhoodConstant: PathOption = <PathOption><any>"Mappings Neighborhood";
    static singleNodeConstant: PathOption = <PathOption><any>"Single Node";
    static singleNodeOrSubordinateConstant: PathOption = <PathOption><any>"Single Node or Subordinate of Another Call";
}

export interface ConceptURI extends String {
    // Only assign the escaped concept URI and the ontology acronym to this 
    conceptUri; // strengthen duck typing
}

export interface SimpleConceptURI extends String {
    // Only assign raw concept URI to this string
    simpleConceptURI; // strengthen duck typing
}

export interface RawAcronym extends String {
    // Only assign the original unadulterated acronym strings to this
    rawAcronym; // strengthen duck typing
}

export interface ConceptUriForIds extends String {
    // Assign id-escaped acronyms here. These are made safe for use in HTML and SVG ids.
    
    conceptUriForIds; // strengthen duck typing
    
//    escapeAcronym(acronym: RawAcronym){
//        //  return acronym.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
//        // JQuery selectors do not work with things that need escaping.
//        // Let's use double underscores instead.
//        return acronym.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '__');
//    }
}

export interface AcronymForIds extends String {
    // Assign id-escaped acronyms here. These are made safe for use in HTML and SVG ids.
    
//    escapeAcronym(acronym: RawAcronym){
//        //  return acronym.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
//        // JQuery selectors do not work with things that need escaping.
//        // Let's use double underscores instead.
//        return acronym.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '__');
//    }
    acronymForId; // strengthen duck typing
}

export interface ConceptIdMap {
    // $(ontologyAcronymNodeMap).attr("vid:"+centralOntologyNode.rawAcronym, centralOntologyNode);
    [id: string]: Node;
}

export class Node extends GraphView.BaseNode {
    simpleConceptUri: SimpleConceptURI; // used rawConceptUri, and before was 'id' but that conflicts with D3. Get this id from conceptData["@id"]
    nodeId: ConceptURI; // escaped concept id plus the concept's acronym. Necessary because some ontologies use concepts from other ontologies.
    // Redundant now?
    conceptUriForIds: ConceptUriForIds; // Utils.escapeIdentifierForId(conceptNode["@id"]);
    name: string; // conceptData.prefLabel
    type: string; // conceptData.type
    description: string; // Comes from description RETS call // = "fetching description";
    definition: Array<string>;
    synonym: Array<string>;
    fixed: boolean; // = true; // lock central node
//    x: number; // = visWidth()/2;
//    y: number; // = visHeight()/2;      
    weight: number; // = numberOfMappedOntologies; // will increment as we loop
    ontologyAcronym: RawAcronym; // ontologyUri.substring(ontologyUri.lastIndexOf("ontologies/")+"ontologies/".length);
    ontologyUri: string; // ontologyUri.substring(ontologyUri.lastIndexOf("ontologies/")+"ontologies/".length);
    ontologyUriForIds: string; // encodeURIComponent(conceptNode.ontologyUri);
    linkParents: string; //URL from REST data
    linkChildren: string; //URL from REST data
    
    tempDepth: number;
    visited: boolean;
    inheritanceChild: boolean;
    treeChildren: Node[]; // for tree layouts

//    uriId: string; // = ontologyDetails["@id"]; // Use the URI instead of virtual id
//    LABEL: string; // = ontologyDetails.name;

    getEntityId(): string{
        return String(this.nodeId);
    }
    
    constructor(){
        super();
    }
    
    /**
     * Use with the D3 data() method for binding link models into D3.
     */
    static d3IdentityFunc(d: Node){
        return String(d.nodeId);
    }
}

export class Link extends GraphView.BaseLink<Node> {
    // We get the ids before we can construct the nodes...
    sourceId: ConceptURI; // = parentId;
    targetId: ConceptURI; // = childId;
    source: Node = null; // = centralOntologyNode;
    target: Node = null; // = ontologyNode;
    rawId: string; //  = edge.sourceId+"-to-"+edge.targetId;
    id: string; // Escaped node ids, otherwise like rawId above. = edge.sourceId+"-to-"+edge.targetId;
    value: number = 1; // This gets used for link stroke thickness later...not needed for concepts?
    relationType: string; // = relationType;
    relationLabel: string;
    relationSpecificToOntologyAcronym: RawAcronym;
    edgePositionSlot: number; // Used to map edges to different lcoatiosn relative to node, based on relationType
    
    constructor(){
        super();
    }
    
    /**
     * Use with the D3 data() method for binding link models into D3.
     */
    static d3IdentityFunc(d: Link){
        return d.rawId;
    }
}

/**
 * Data retrieved from REST calls. Interface allows stronger (duck) typing of the
 * data. Adding because of a bug involving argument order.
 */
export interface NodeData {
    "@context": any;
    "@id": string; // eg. "http://purl.bioontology.org/ontology/SNOMEDCT/123037004"
    "@type": string; // eg."http://www.w3.org/2002/07/owl#Class"
    links: {mappings: string; children: string; parents: string; }; // URLs to the respective data
    prefLabel: string; // eg. "Body structure"
}

export class ConceptD3Data extends GraphView.GraphDataForD3<Node, Link> {
    
}


class DeferredCallbacks{
    wrappedParseNodeCallbacks: Array<{(halt: boolean, maxToAdd: number): number}> = [];
    
    constructor(
        public graph: ConceptGraph
        ){}
    
    addCallback(callback: {(maxToAdd: number): number}, expansionSet: ExpansionSets.ExpansionSet<Node>){
        var expSetUpdateWrapper =
            (haltExpansions: boolean, maxNodesToGet: number)=>{
                // Have to check if we are stopping, mark the related expansion set if so,
                // or fetch the node otherwise.
                if(haltExpansions || expansionSet.expansionCutShort()){
                    // Why do we check if the expansion set is already cut short??? That seems silly.
                    // We check if the expansion set is cut short in case we want other effects that setting it as halted.
                    // Setting expansionCutShort() prevents nodes later in the associated expansion set
                    // from being loaded when they are past the cutoff.
                    expansionSet.expansionCutShort(haltExpansions);
                    return;
                } else {
                    expansionSet.thunderbirdsAreGo();
                    return callback(maxNodesToGet);
                }
            }
        ;
        this.wrappedParseNodeCallbacks.push(expSetUpdateWrapper);

        // I originally wanted to use the length of the wrapped callbacks,
        // but that is re-produced every time the user triggers an expansion.
        // Instead I need to use the expansion set's counts, because callbacks can
        // be entered into here that already correspond to a loaded node, and will
        // elegantly resolve later.
        // Even though these counts don't match, and that the wrapped callbacks will generally be
        // bigger, it's ok; the graph system is set up to not redundantly load nodes. I cannot easily
        // handle that from here, so I can't intelligently prevent wrapped callbacks from being called
        // when they will be dead ends, except from the caller. This is my safety in case
        // that is not done by the caller.
        this.graph.refreshNodeCapDialogNodeCount(expansionSet.getNumberOfNodesMissing());
    }
    
    complete(haltExpansions: boolean, maxNodesToGet: number): void{
        var i = 0;
        for(i = 0; i < this.wrappedParseNodeCallbacks.length; i++){
            if(i === maxNodesToGet && !haltExpansions){
                // If we are halting expansion, we need to call for each
                // callback, to let the wrapped callback update the expansion set,
                // marking it as cut short.
                break;
            }
            // This is vital to communicate to the expansion set for some
            // later nodes coming in, to prevent duplicate dialogs and accidental
            // node loading.
            // We also tell each expansion how many nodes it was allowed to load
            // via this process, although it will need to account for any nodes loaded
            // prior to the node cap dialog being presented.
            var claimedNodes = this.wrappedParseNodeCallbacks[i](haltExpansions, maxNodesToGet);
            // However many nodes the callback claims it will expand, we must decrement from
            // our maximum amount.
            maxNodesToGet -= claimedNodes;
        }
        // Cut out whatever we processed. Leave any we didn't (due to max nodes argument).
        this.wrappedParseNodeCallbacks = this.wrappedParseNodeCallbacks.slice(i);
        this.wrappedParseNodeCallbacks = [];
    }
}
    

export class ConceptGraph implements GraphView.Graph<Node> {
    
    static CONCEPT_URI_SEPARATOR = "::";
    
    expMan: ExpansionManager.ExpansionManager;
    
    graphD3Format: ConceptD3Data = new ConceptD3Data();
    
    // To track nodes that we have in the graph (by id):
    conceptIdNodeMap: ConceptIdMap = {};
    elementIdNodeMap: ConceptIdMap = {};
    
    private nodeMapChanged = false;
    addNodeToIdMap(conceptNode: Node){
        this.nodeMapChanged = true;
		this.conceptIdNodeMap[String(conceptNode.nodeId)] = conceptNode;
        this.elementIdNodeMap[String(conceptNode.conceptUriForIds)] = conceptNode;
    }
    
    removeNodeFromIdMap(conceptNode: Node){
        this.nodeMapChanged = true;
        delete this.conceptIdNodeMap[String(conceptNode.nodeId)];
        delete this.elementIdNodeMap[String(conceptNode.conceptUriForIds)];
    }
    
    /**
     * Perfect for testing to see if nodes are deleted, when other entities hold on
     * to them for a good reason (expansion sets).
     */
    nodeIsInIdMap(node: Node): boolean{
        return undefined !== this.getNodeByUri(node.nodeId);
    }
    
    getNodeByUri(uri: ConceptURI): Node{
        return this.conceptIdNodeMap[String(uri)];
    }
    
    /**
     * Accepts strings because this will be used when we have an SVG elment and need
     * the node model that corresponds; thus it comes off the element as a string.
     */
    getNodeByIdUri(idSafeUri: String): Node{
        return this.elementIdNodeMap[String(idSafeUri)];
    }
    
    private ontologiesInGraph = new Array<RawAcronym>();
    getOntologiesInGraph(): Array<RawAcronym>{
        if(!this.nodeMapChanged){
            return this.ontologiesInGraph;
        }
        this.nodeMapChanged = false;
        var ontologies: {[acronym: string]: RawAcronym} = {};
        this.ontologiesInGraph = new Array<RawAcronym>();
        for(var i = 0; i < this.graphD3Format.nodes.length; i++){
            var nodeData = this.graphD3Format.nodes[i];
            if(ontologies[String(nodeData.ontologyAcronym)] === undefined){
                this.ontologiesInGraph.push(nodeData.ontologyAcronym);
            }
            ontologies[String(nodeData.ontologyAcronym)] = nodeData.ontologyAcronym;
        }
        return this.ontologiesInGraph;
    }
    
    convertEdgeTypeLabelToEdgeClass(){
        
    }
    
    /**
     * Used for stylings, not selections
     */
    relationTypeCssClasses = {
            "is_a": "inheritanceStyleLink",
            "part_of": "compositionStyleLink",
            "maps_to": "mappingStyleLink",
    };
    relationLabelConstants = {
            "inheritance": "is_a",
            "composition": "part_of",
            "mapping": "maps_to",
    };
    
    layoutProvider: LayoutProvider.ILayoutProvider;
    
    public getLayoutProvider(): LayoutProvider.ILayoutProvider{
        return this.layoutProvider;   
    }
    
    public setLayoutProvider(layoutProvider: LayoutProvider.ILayoutProvider){
        this.layoutProvider = layoutProvider;
    }
    
    constructor(
        public graphView: GraphView.GraphView<Node, Link>,
        public centralConceptUri: ConceptURI,
        public softNodeCap: number,
        public undoBoss: UndoRedoManager.UndoRedoManager
        ){
        // Passing undo boss makes the msot sense, since expansions are very graphy,
        // so the graph can own the expansion manager and merely use the undo system.
        this.expMan = new ExpansionManager.ExpansionManager(undoBoss);
    }
    
    /**
     * Used with expansion sets. Note that the node is already created here.
     */
    addNodes(newNodes: Array<Node>, expansionSet: ExpansionSets.ExpansionSet<Node>){
        // Deletion sets lead back into addNodes() when done, but both they and expansion
        // sets are ignorant of eachother. Allow null to be passed here.
        if(null !== expansionSet){
            expansionSet.addAll(newNodes);
        }
        for(var i = 0; i < newNodes.length; i++){
            // Only implementing here rather than in graphView because of this container...
            this.graphD3Format.nodes.push(newNodes[i]);
            // Also, we like looking them up by id
            this.addNodeToIdMap(newNodes[i]);
        }
        
        this.graphView.stampTimeGraphModified();
        
        this.graphView.populateNewGraphElements(this.graphD3Format)
        for(var i = 0; i < newNodes.length; i++){
            // If there are implicit edges from before that link from an existing node to this new one,
            // we can now manifest them.
            this.manifestEdgesForNewNode(newNodes[i]);
        }
        
        // Special case...
        // Trying to get mapping expansions to have their mapping edges added when redoing
        // an undo. Without this, the mapping arcs don't get processed for the target nodes
        // as they run through the manifestEdgesForNewNode() because they are registered on
        // the source node only.
        if(null != expansionSet && null != expansionSet.parentNode){
            this.manifestEdgesForNewNode(expansionSet.parentNode);
        }
    }
    
    removeNodes(nodesToRemove: Array<Node>){
        TipsyToolTipsOnClick.closeOtherTipsyTooltips();
        
        this.graphD3Format.nodes = this.graphD3Format.nodes.filter(
            function(node: Node, index: number, nodes: Node[]): boolean {
                // Keep only those that do not appear in the removal array
                return nodesToRemove.indexOf(node) === -1;
            }
        );
        for(var i = 0; i < nodesToRemove.length; i++){
            // Only implementing here rather than in graphView because of this container...
            // Also, we like looking them up by id
            this.removeNodeFromIdMap(nodesToRemove[i]);
        }
        
        this.graphView.stampTimeGraphModified();
        
        // Edges depend on nodes when rendering, but not vice versa, so let's
        // remove them first
        this.removeManifestEdges(nodesToRemove);
        this.graphView.removeMissingGraphElements(this.graphD3Format);
    }
    
    containsNode(node: Node): boolean{
        return this.conceptIdNodeMap[String(node.nodeId)] !== undefined;
    }
    
    containsNodeById(nodeId: ConceptURI): boolean{
        return this.conceptIdNodeMap[String(nodeId)] !== undefined;
    }
    
     
    findNodesByName(substringRaw: string): Array<Node>{
        var substringLower = substringRaw.toLowerCase();
        var matchNodes = this.graphD3Format.nodes.filter(
            function(node: Node, index: number, nodes: Node[]): boolean {
                // Keep only those that do not appear in the removal array
                var keep: boolean = node.name.toLowerCase().search(substringLower) > -1;
                $.each(node.synonym, (i, entry)=>{
                    keep = keep || entry.search(substringLower) > -1;
                });
                
                return keep;
            }
        );
        return matchNodes;
    }
    
    private addEdges(newEdges: Array<Link>, temporaryEdges: boolean = false){
        if(newEdges.length == 0){
            // Saves a lot of work deeper down.
            return;
        }
        for(var i = 0; i < newEdges.length; i++){
            // Only implementing here rather than in graphView because of this container...
            if(this.edgeNotInGraph(newEdges[i])){
                newEdges[i].source = this.conceptIdNodeMap[String(newEdges[i].sourceId)];
                newEdges[i].target = this.conceptIdNodeMap[String(newEdges[i].targetId)];
                this.graphD3Format.links.push(newEdges[i]);
            }
        }
        this.graphView.populateNewGraphEdges(this.graphD3Format.links, temporaryEdges);
    }
    
    /**
     * See removeManifestEdges for model book keeping that must be done
     * prior to removing edges from the view.
     * Gets called when removing temporary mapping edges (those edges that only render on node hover).
     */
    private removeEdges(edgesToRemove: Array<Link>, temporaryOnly: boolean = false){
        this.graphD3Format.links = this.graphD3Format.links.filter(
            function(link: Link, index: number, links: Link[]): boolean {
                // Keep only those that do not appear in the removal array
                return edgesToRemove.indexOf(link) === -1;
            }
        );
        
        this.graphView.stampTimeGraphModified();
        
        this.graphView.removeMissingGraphElements(this.graphD3Format, temporaryOnly);
        
        for(var l = 0; l < edgesToRemove.length; l++){
            // Was doing this earlier, but D3 cries if I do it before re-binding,
            // I think because I use the source and target as parts of the
            // identifier function.
            edgesToRemove[l].source = null;
            edgesToRemove[l].target = null;
        }
    }
    
    private removeManifestEdges(nodesToRemove: Array<Node>){
        var edgesToDelete = [];
        for(var i = 0; i < nodesToRemove.length; i++){
            // For each node we are removing, we de-manifest its edges, and re-register it into the
            // registry so it can be manifested again later. Annoying, but the register system was
            // extremely vital to prevent wasteful REST calls.
            var node = nodesToRemove[i];
            var incidentEdges = this.getAdjacentLinks(node);
            for(var l = 0; l < incidentEdges.length; l++){
                var edge = incidentEdges[l];
                edgesToDelete.push(edge);
            }
        }
        
        // There is also the problem of mapping edges that should be removed because an undo
        // event has been performed. All remaining edges need to be inspected, and those that
        // are not still valid to show must be removed as well.
        this.graphD3Format.links.forEach(
            (edge: Link, index: number, edges: Link[])=>{
                // Keep only those that would be temporary hover edges
                // NB This should work as long as the redo state is resolved before adding/removing graph elements.
                if(this.isEdgeForTemporaryRenderOnly(edge)){
                    edgesToDelete.push(edge);
                }
            }
        );
        
        this.graphView.stampTimeGraphModified();
                
        this.removeEdges(edgesToDelete);
    }
    
    private getOntologyAcronymFromOntologyUrl(ontologyUri){
        var urlBeforeAcronym = "ontologies/";
        var urlAfterAcronym = "/";
        return ontologyUri.substring(ontologyUri.lastIndexOf(urlBeforeAcronym)+urlBeforeAcronym.length);
    }
    
    /**
     * Counts the number of unadded nodes for a given expansion type (currently mapping or term neighbourhood expansions,
     * not any others). This allows us ot estimate the number of nodes that would be added if the expansion were performed.
     * Gives the current outstanding number, not the total.
     */
    getNumberOfPotentialNodesToExpand(expandingNode: Node, nodeInteraction: UndoRedoManager.NodeInteraction, specificRelationType:string = "any"){
        var expandingNodeId = expandingNode.nodeId;
        var numNewNodesIncoming = 0;
        var otherCount = 0;
        var edges = this.expMan.edgeRegistry.getEdgesFor(<ConceptURI><any>expandingNodeId);
        var nodesSeen = {};
        edges.forEach((edge: Link)=>{
            // Currently, the only mapping edges are "maps_to", and all others count as term neighbourhood types.
            var edgeExpansionType =
                edge.relationType === this.relationLabelConstants.mapping
                ? PathOptionConstants.mappingsNeighborhoodConstant
                : PathOptionConstants.termNeighborhoodConstant;

            var otherConceptId: ConceptURI = (edge.sourceId === expandingNodeId) ? edge.targetId : edge.sourceId;

            // Check if temporary, because we want to allow expansion along those edges.
            if(
                (
                    (this.isEdgeForTemporaryRenderOnly(edge) && edgeExpansionType === PathOptionConstants.termNeighborhoodConstant)
                    ||
                    this.nodeMayBeExpanded1(otherConceptId, <ConceptURI><any>expandingNodeId, nodeInteraction, edgeExpansionType)
                )
                && null == nodesSeen[String(otherConceptId)]
                ){
                    if("parents" === specificRelationType
                        && (edge.targetId !== expandingNodeId || edge.relationType !== this.relationLabelConstants.inheritance)){
                        // Nope
                    } else if("children" === specificRelationType
                        && (edge.sourceId !== expandingNodeId || edge.relationType !== this.relationLabelConstants.inheritance)){
                        // Nope
                    } else if("other" === specificRelationType
                        && edge.relationType === this.relationLabelConstants.inheritance){
                        // or mapping, which was skipped already
                        // Allow composite and all other ontology specific ones
                        // Nope
                    } else {
                        numNewNodesIncoming++;
                        nodesSeen[String(otherConceptId)] = true;
                    }
            }
        });
        
        return numNewNodesIncoming;
    }
    
    
    /**
     * When we have too many nodes in the graph, we warn the user about it every time we have added an
     * additional nodeCapInterval nodes.
     */
    nodeCapInterval = 20;
    nextNodeWarningCount = undefined;
    private deferredParseNodeCallBack: DeferredCallbacks = undefined;
    times = 0;
    // When we are about to do a fetch that will result in a node expansion, we need to
    // see if the user thinks we already have too many nodes.
    // This re-wrapping of callbacks is necessary because we can only do the user check prior
    // to asynchronous events, because Javascript has no capacity for stalling execution.
    // If it did, some other options would be available to us.
    // NB We could have this inside the fetching utility or inside the node related callbacks, except
    // that the former would complicate non-node fetches, and the latter would necessitate doing the
    // fetch and calling the callback, costing us the fetch but still saving on node load.
    checkForNodeCap(fetchCallback: {(maxToAdd: number): number}, expansionSet: ExpansionSets.ExpansionSet<Node>, numberNewNodesComing: number){
        // Assuming we reliably check for capping prior to dispatching node fetches, we can
        // know how many nodes are incoming for a given expansion set by incrementing it here.
        
        if(0 === numberNewNodesComing){
            // Not actually adding anything, skip dialog check. Better for caller to check, isn't it?
            // But...if we are expanding mappings that are all present, but the edges are permanent, we need
            // to actually add those edges. Let's do that.
            fetchCallback(null);
            return;
        }
        
        if(expansionSet.expansionCutShort()){
            // If we are rejecting node parse callbacks for this expansion set, then let the callback that was passed in
            // simply fade away into the everlasting garbage collector.
            // NB The expansion set will not be reused even if the same expansion is retriggered.
            return;
        }
        
        if(undefined === this.nextNodeWarningCount){
            this.nextNodeWarningCount = this.softNodeCap;
        }
        
        // If the graph population has shrunk, I want to make sure that expanding it again will offer the user
        // the capping dialog anew.
        while(
            this.graphD3Format.nodes.length < (this.nextNodeWarningCount - this.nodeCapInterval)
            && this.softNodeCap < this.nextNodeWarningCount
            ){
            // We have to account for shrinking graphs. Just because the user said ok to lots of nodes previously
            // doesn't mean they will say ok again.
            // Decrement our current cap until we are closer to the existing number of nodes.
            this.nextNodeWarningCount -= this.nodeCapInterval;
            this.nextNodeWarningCount = Math.max(this.nextNodeWarningCount, this.softNodeCap);
        }
        
        var dialogOpen = $("#confirm").is(":visible");
        if(dialogOpen || 
                ((this.graphD3Format.nodes.length + 1) > this.nextNodeWarningCount)
                || ((this.graphD3Format.nodes.length + numberNewNodesComing) > this.nextNodeWarningCount)
            ){
            // So, this logic lets all possible mappings through, because mappings calls are registered in a quick loop
            // and the fetches get called before any node is processed from any of those fetches.
            if(undefined === this.deferredParseNodeCallBack){
                this.deferredParseNodeCallBack = new DeferredCallbacks(this);
            }
            // If we are currently awaiting user input to the node cap dialog, then we stick the callback right into
            // the queue. It will be dealt with one way or another once the user has responded.
            // NB This means that each dialog will be responding for *any* expansion sets being worked with while it is
            // open. Will it be problematic if two come near each other??
            this.deferredParseNodeCallBack.addCallback(fetchCallback, expansionSet);

            this.showNodeCapDialog(numberNewNodesComing);
            
        } else if(!dialogOpen) {
            // We're below the cap and the expansion hasn't been previously cut short
            // so we will execute the fetch.
            // This also gets called on the expansion set internal to deferredParseNodeCallback above.
            expansionSet.thunderbirdsAreGo();
            fetchCallback(numberNewNodesComing);
        }
    }
    
    private nodeCapResponseCallback(haltExpansion: boolean, nodesToAdd: number){
        if(!haltExpansion){
            this.nextNodeWarningCount += nodesToAdd;
        }
        this.deferredParseNodeCallBack.complete(haltExpansion, nodesToAdd);
    }
    
    /**
     * Used in the refresh and modal trigger methods, to determine if the expansion has been allowed to fully expand.
     */
    currentModalDialogIncomingNodeCount: number = 0;
    refreshNodeCapDialogNodeCount(numberNewNodesComing?: number) {
        $("#nodeCapDialogMessage")
        .empty()
        .append($("<span>").text("You are about to add multiple nodes to the visualization."+"\n"
            +"In total, "))
        .append($("<b>").text(this.graphD3Format.nodes.length))
        .append($("<span>").text(" nodes are in the graph, but "))
        .append($("<b>").text(numberNewNodesComing))
        .append($("<span>").text(" more may be added."+"\n\n"+
            "Would you like to limit the number of nodes? If you change your mind, you can re-expand the concepts/mappings later."))
        ;
        
        $("label#capDialogLabel").text("Load up to: ");
        if(undefined === numberNewNodesComing){
            $("input#capDialogInput").attr("max", 20+"");
        } else {
            $("input#capDialogInput").attr("max", numberNewNodesComing+"");
            this.currentModalDialogIncomingNodeCount = numberNewNodesComing;
        }
    }
    
    
    private showNodeCapDialog(numberNewNodesComing?: number){
        this.currentModalDialogIncomingNodeCount = 0;
        var outerThis = this;
        $('#confirm').modal({
            closeHTML: "<a href='#' title='Close' class='modal-close'>x</a>",
            position: ["20%",],
            overlayId: 'confirm-overlay',
            containerId: 'confirm-container', 
            onShow: function (dialog) {
                var modal = this;
                
                var message = $("<div>").attr("id", "nodeCapDialogMessage").css("white-space", "pre-wrap");
                
                // Tired of fighting with CSS
                $("#confirm-container").css("height", "auto");
                $('.message', dialog.data[0]).append(message);
                $("div.buttons").css("width", "auto");
                
                var nodesToLoadInput = $("<input>").attr("id", "capDialogInput").attr("name", "capDialogInput")
                    .attr({"type": "number", "min": "0", "max": numberNewNodesComing+"", })
                    .css("width", "4em")
                    .change(()=>{ $(".yes").text("Add "+$("#capDialogInput").val()); })
                    .keyup(()=>{ $(".yes").text("Add "+$("#capDialogInput").val()); })
                    .val(outerThis.nodeCapInterval+"");
                var nodesToLoadLabel = $("<label>").attr("id", "capDialogLabel").attr("for", "capDialogInput"); //.append(nodesToLoadInput);
                outerThis.refreshNodeCapDialogNodeCount(numberNewNodesComing);

                
                // if the user clicks "yes"
                $('.yes', dialog.data[0]).click(function () {
                    // close the dialog
                    modal.close(); // or $.modal.close();
                    // call the callback
                    // If we allow anything less than all of the nodes in, the expansion has to be treated as halted.
                    var nodesToAdd = parseInt(nodesToLoadInput.val(), 10);
                    
                    // Do not want to *halt* the expansion if it is all the nodes available...
                    // var haltExpansion: boolean = nodesToAdd === outerThis.currentModalDialogIncomingNodeCount;
                    
                    // TODO What about the fact that there are still incoming counts arriving when the user
                    // has the opportunity to select how many to add?
                    outerThis.nodeCapResponseCallback(false, nodesToAdd);
                });
                
                $('.no', dialog.data[0]).click(function () {
                    // close the dialog
                    modal.close(); // or $.modal.close();
                    // call the callback
                    outerThis.nodeCapResponseCallback(true, 0);
                });
                
                $(".yes").before(nodesToLoadLabel);
                nodesToLoadLabel.after(nodesToLoadInput);
                
                $(".yes").text("Add "+outerThis.nodeCapInterval);
                $(".no").text("Stop");
                $("div.buttons").css("padding", "0px 5px 5px 0px");

				// http://jqueryui.com/draggable/#handle
                $($("#confirm-container")).draggable({ handle: $("#simplemodal-GrabHandle") } );
            }
        });
    }
    
    static computeNodeId(id: SimpleConceptURI, ontologyAcronym: RawAcronym ): ConceptURI;
    static computeNodeId(conceptData: {"@id": string; links: {ontology: string}}): ConceptURI;
    static computeNodeId(conceptData: any, ontologyAcronym?: RawAcronym): ConceptURI {
        if(null == ontologyAcronym){
            ontologyAcronym = this.computeOntologyAcronym(conceptData);
        }
        if(null != conceptData["@id"]){
            conceptData = conceptData["@id"];
        }
        return <ConceptURI><any>(Utils.escapeIdentifierForId(conceptData) + ConceptGraph.CONCEPT_URI_SEPARATOR + ontologyAcronym);
    }
    
    public computeNodeId(id: SimpleConceptURI, ontologyAcronym: RawAcronym ): ConceptURI;
    public computeNodeId(conceptData: {"@id": string; links: {ontology: string}}): ConceptURI;
    public computeNodeId(conceptData: any, ontologyAcronym?: RawAcronym): ConceptURI {
        return ConceptGraph.computeNodeId(conceptData, ontologyAcronym);
    }
    
    static computeOntologyAcronym(conceptData): RawAcronym{
        var ontologyUri;
        if(undefined != conceptData.links){
            ontologyUri = conceptData.links.ontology;
        } else {
            ontologyUri = conceptData;
        }
        // "http://data.bioontology.org/ontologies/<acronym>"
        var urlBeforeAcronym = "ontologies/";
        return ontologyUri.substring(ontologyUri.lastIndexOf(urlBeforeAcronym)+urlBeforeAcronym.length);
    }
    
    public computeOntologyAcronym(conceptData): RawAcronym{
        return ConceptGraph.computeOntologyAcronym(conceptData);
    }
             
    public parseNode(index: number, conceptData, expansionSet: ExpansionSets.ExpansionSet<Node>){

            var ontologyAcronym = this.computeOntologyAcronym(conceptData);
            var nodeId = this.computeNodeId(conceptData);

            if(this.conceptIdNodeMap[String(nodeId)] !== undefined){
            	// Race conditions involving REST latency can lead to multiple
            	// attempts to create the same node, particularly when composition
            	// and inheritance overlap (regardless if that is desireable in ontologies).
                return this.conceptIdNodeMap[String(nodeId)];
            }
            
            // Some node ids are not referenced within Bioportal. That is, if the "self" URL is followed,
            // there will be a 404 error. I can detect this sooner than that by checking to see if they
            // have no prefLabel supplied.
            // I know understand these ids to be (possibly) blank nodes. Read about blank nodes and Skolemization.
            // It's dirty business, but I think we should render these nodes, since they provide structural information.
            // I am not sure about the best way to label them, but I feel that "<no prefLabel>" is accurate enough and could
            // elicit users to click the node to see if it has any description, etc.
            var prefLabel = conceptData.prefLabel;
            if(prefLabel == null){
                console.log("Missing prefLabel for concept: id="+conceptData["@id"]+" (link = "+conceptData.links.self+")");
                // return null;
                prefLabel = "<no prefLabel>";
            }
            
            // Create the concept nodes that exist on the paths-to-root for the central concept,
            // including the central concept node.
            var conceptNode = new Node();
            conceptNode.nodeId = nodeId;
            conceptNode.conceptUriForIds = Utils.escapeIdentifierForId(String(nodeId));
            conceptNode.simpleConceptUri = <SimpleConceptURI>conceptData["@id"];
            conceptNode.name = prefLabel;
            conceptNode.type = conceptData["@type"];
            conceptNode.description = "fetching description";
            conceptNode.definition = conceptData["definition"];
            conceptNode.synonym = (null == conceptData["synonym"]) ? [] : conceptData["synonym"];
            conceptNode.weight = 1;
            conceptNode.fixed = false;
            conceptNode.tempDepth = 0;
            conceptNode.visited = false;
            conceptNode.inheritanceChild = false;
            conceptNode.treeChildren = [];
            // conceptNode.x = this.graphView.visWidth()/2; // start in middle and let them fly outward
            // conceptNode.y = this.graphView.visHeight()/2; // start in middle and let them fly outward
            conceptNode.ontologyAcronym = ontologyAcronym;
            conceptNode.ontologyUri = conceptData.links.ontology;
            conceptNode.ontologyUriForIds = encodeURIComponent(conceptNode.ontologyUri);
            conceptNode.nodeColor = this.nextNodeColor(conceptNode.ontologyAcronym);
            conceptNode.linkParents = conceptData.links.parents;
            conceptNode.linkChildren = conceptData.links.children;
            
            // TODO Shall I reference the caller, or handle these in another way? How did I do similar stuff in ontology graph?
            // Could accumulate in caller?
            this.addNodes([conceptNode], expansionSet);
            
            // Understanding arcs:
            // Concept links come from different calls. We will probably need to use the links container
            // to collect all possible links that we know about, indexed by the concept that is not currently
            // included in our graph. When we get another concept added to the graph, we look it up in there,
            // add all the links to the graph, and remove the entries from the possible-links object.
            // This works only if we are able to add any given node prior to having to sort through its relations.
            // This also means that adding links has to be done in a separate process, and can't happen
            // in a smooth way when processing node information.
            // In Biomixer, these links were added as unrendered objects as they came up I think. We don't want
            // unrendered SVG in D3.
            // In any case, relations don't show up in the paths_to_root data anyway, so we need a separate process
            // because of that alone :)
            // We will need to inspect for relations in the registry, to see if there are any
            // implicit ones that have now been fulfilled by this node being added...is that correct to do here?
            // Registry should probably only have edges indexed by the *non-present* nodes, so that there is a simple
            // lookup for incoming nodes.
            // We also check for node endpoints in the graph before registering the implicit edges, so there's no risk of
            // adding an edge when it should instead be manifested in the graph.
            
            // Moved this into the addNodes() call
            // this.manifestEdgesForNewNode(conceptNode);
            
            return conceptNode;
    }
    
    /**
     * Created for composition expansions, where we never have node data available. Can be used any time we need to expand a specific node,
     * and when we know the ontology of that node (such as when doing concept expansions).
     */
    public expandMappedConcept(newConceptId: ConceptURI, newConceptMappingData, relatedConceptId: ConceptURI, expansionType: PathOption, expansionSet: ExpansionSets.ExpansionSet<Node>){
        var newNodeUri = this.computeNodeId(newConceptMappingData);
        if(expansionType === PathOptionConstants.mappingsNeighborhoodConstant
            && this.nodeMayBeExpanded(newNodeUri, relatedConceptId, expansionType, expansionSet)){
            
            // Moved node cap check to caller of this, where we have an estimate of incoming nodes.        
            var url = newConceptMappingData.links.self;
            var callback = new FetchOneConceptCallback(this, url, newNodeUri, expansionSet);
            var fetcher = new Fetcher.RetryingJsonFetcher(url);
            fetcher.fetch(callback, true);
        }
        
    }

    
    /**
     * Created for composition expansions, where we never have node data available. Can be used any time we need to expand a specific node,
     * and when we know the ontology of that node (such as when doing concept expansions).
     */
    public expandRelatedConcept(conceptsOntology: RawAcronym, newConceptId: SimpleConceptURI, relatedConceptId: ConceptURI, expansionType: PathOption, expansionSet: ExpansionSets.ExpansionSet<Node>){
        var newNodeId = this.computeNodeId(newConceptId, conceptsOntology);
        if(this.nodeMayBeExpanded(newNodeId, relatedConceptId, expansionType, expansionSet)){
            
            // Moved node cap check to caller of this, where we have an estimate of incoming nodes.             
            var url = this.buildConceptUrlNewApi(conceptsOntology, newConceptId);
            var callback = new FetchOneConceptCallback(this, url, newNodeId, expansionSet);
            var fetcher = new Fetcher.RetryingJsonFetcher(url);
            fetcher.fetch(callback, true);
        }
    }
    
    /**
     * Intended for adding arbitrary concepts, on the basis of their URI, to the graph.
     */
    public addNodeToGraph(newConceptId: SimpleConceptURI){
        // To get the ontology id...do a search for the concept id, then iterate through the results to find
        // an entity with a perfectly matching concept id!!!
        var url = this.buildConceptSearchUrlNewApi(newConceptId);
        var callback = new SearchOneConceptCallback(this, url, newConceptId);
        var fetcher = new Fetcher.RetryingJsonFetcher(url);
        fetcher.fetch(callback, true);
    }
    
    public nodeMayBeExpanded1(newConceptId: ConceptURI, relatedConceptId: ConceptURI, nodeRelationExpansionType: UndoRedoManager.NodeInteraction, desiredRelationType: UndoRedoManager.NodeInteraction): boolean{
        return relatedConceptId !== newConceptId
            && nodeRelationExpansionType === desiredRelationType
            && !(String(newConceptId) in this.conceptIdNodeMap)
            && this.nodeIsAccessible(newConceptId)
            ;   
    }
    
    public nodeMayBeExpanded(newConceptId: ConceptURI, relatedConceptId: ConceptURI, nodeRelationExpansionType: PathOption, expansionSet: ExpansionSets.ExpansionSet<Node>): boolean{
        if(null === expansionSet.parentNode || null === nodeRelationExpansionType){
            return false;
        }
        return relatedConceptId === expansionSet.parentNode.nodeId
            && this.nodeMayBeExpanded1(newConceptId, expansionSet.parentNode.nodeId, nodeRelationExpansionType, expansionSet.expansionType);
    }
    
    /**
     * Some nodes result in 403, 404 or other errors when REST calls re amde, and they will not be available.
     * We have to account for this nodes to offer the user accurate (and non-confusing) expansion estimates.
     */
    public nodeIsAccessible(newConceptId: ConceptURI): boolean {
        return !this.expMan.nodeIsInaccessible(newConceptId);
    }
    
    public expandAndParseNodeIfNeeded(newConceptId: ConceptURI, relatedConceptId: ConceptURI, conceptPropertiesData, expansionType: PathOption, expansionSet: ExpansionSets.ExpansionSet<Node>, parentName: string){
        // Can determine on the basis of the relatedConceptId if we should request data for the
        // conceptId provided, or if we should parse provided conceptProperties (if any).
        // TODO PROBLEM What if the conceptId is already going to be fetched and processed because
        // it has a fetcher running on the basis of some other relation?
        // In paths to root, it won't happen, because we would only want to parse from the original call.
        // In mappings, we only expand mapped nodes in the original call.
        // In term neighbourhood, we do indeed parse nodes on the basis of parent and child
        // relations, as well as composition relations. But...only if they are related to the
        // central one. So simply checking for that combination of facts here works out fine.
        
        // For path to root, we only expand those path to root nodes.
        // For term neighbourhood, we only expand the direct neighbours of the central node.
        // For mappings, we only expand based on the first mapping call.
        // This will go through a whole process of adding the node, if the node is supposed to be
        // expanded for the current visualization (children and parents for term neighbourhood).
        
        // Because we expand for term neighbourhood relation calls, and those come in two flavors
        // (node with properties for children and parents, and just node IDs for compositions)
        // we want to support parsing the data directly as well as fetching additional data.
        if(this.nodeMayBeExpanded(newConceptId, relatedConceptId, expansionType, expansionSet)
            && this.nodeIsAccessible(newConceptId)){

            // Manifest the node; parse the properties if available.
            // We know that we will get the composition relations via a properties call,
            // and that has all the data we need from a separate call for properties...
            // but that subsystem relies on the fact that the node is created already.
            
            if(!(conceptPropertiesData === undefined) && Object.keys(conceptPropertiesData).length > 0
                && expansionType !== PathOptionConstants.mappingsNeighborhoodConstant){
                // Would process the node data available for mappings, but we need the "prefLabel" property,
                // which is not included therein, so we need a separate call rather than immediate parsing.
                // The delay in rendering seems to be negligable in practice.
                // Otherwise, we parse such as when it is a child or parent inheritance relation for term neighbourhood
                var conceptNode = this.parseNode(undefined, conceptPropertiesData, expansionSet);
                if(null == conceptNode){
                    return;
                }
                // Don't show progress indicator, because this node won't have its relations expanded further down,
                // because it never receives the directCallForExpansionType argument
                this.fetchConceptRelations(conceptNode, conceptPropertiesData, expansionSet);
            } else {
                console.log("Error: no data passed to expansion and parsing method");
            }
        }
    }
    
    /*
     * Parent and child arguments determine arrow direction. Relation type can 
     * reflect inheritance, composition, or mapping.
     * I *think* that every time we register one of these, we should check and see if
     * the endpoints are in the graph, and if so, manifest the edge right away.
     * Likewise, I think, we should check for edge inclusions every time a node is
     * manifested. Otherwise we end up with problems...if...data integrity is not perfect
     * in a given ontology (has_part and part_of are not symmetrically stated, even though
     * semantically they necessitate each other; if not symmetrically defined, we will only
     * find the relation when manifesting nodes in one order, unless we always look for
     * edges when manifesting nodes).
     */
    public manifestOrRegisterImplicitRelation(parentIdUri: ConceptURI, childIdUri: ConceptURI, relationId: string, relationProperty?: PropRel.OntologyRelation){
        if(parentIdUri === childIdUri){
            // Some mappings data is based off of having the same URI, which is mind boggling to me.
            // We have no use for self relations in this domain.
            return;
        }
        
        if(!this.nodeIsAccessible(childIdUri) || !this.nodeIsAccessible(parentIdUri)){
            return;
        }
        
        // Either register it as an implicit relation, or manifest it if both nodes are in graph.
        var edge = new Link();
        // edge source and targe tobjects will be set when manifesting the edge (when we know we have
        // node objects to add there). They are looked up by these ids.
        // TODO source/target and parent/child are not clear...which way do we need this to be?
        // I prefer using parent/child in model, but for the graph, arrow representation is clearer
        // using source and target.
        edge.sourceId = parentIdUri;
        edge.targetId = childIdUri;
        edge.rawId = edge.sourceId+"-to-"+edge.targetId+"-of-"+relationId;
        edge.relationType = relationId;
        
        if(relationId === this.relationLabelConstants.inheritance
                || relationId === this.relationLabelConstants.mapping){
            edge.edgePositionSlot = 0;
        } else if(relationId === this.relationLabelConstants.composition) {
            edge.edgePositionSlot = 1;
        } else {
            // Since this comes from actual edge objects, they will indeed be created serially and have different values here.
            var numExistingEdgesBetweenPair = this.expMan.edgeRegistry.getEdgesFor(edge.sourceId, edge.targetId).length;
            edge.edgePositionSlot = numExistingEdgesBetweenPair + 2; // +2 for the inheritance and composition positions
        }
        
        if(relationProperty === undefined){
            edge.relationLabel = relationId;
        } else {
            if(undefined === relationProperty.label){
                var idSections = relationId.split("__");
                edge.relationLabel = idSections[idSections.length-1];
            } else {
                edge.relationLabel = relationProperty.label;
            }
            edge.relationSpecificToOntologyAcronym = relationProperty.ontologyAcronym;
        }
        edge.id = Utils.escapeIdentifierForId(edge.sourceId)+"-to-"+Utils.escapeIdentifierForId(edge.targetId)+"-of-"+relationId;
        edge.value = 1; // This gets used for link stroke thickness later...not needed for concepts?
        
        // Changing the registry to be permanent, and to have no assumptions about gaph population.
        // All edges we learn about from REST services are permanently registered, and available for manifestation.
        // Do we need to check if it is already registered? Probably not!
        // We always want to register, since the registry is the permanent store of known edges.
        var preExistingEdge = this.registerImplicitEdge(edge);
        
        if(null !== preExistingEdge){
            // We found a matching edge in the registry, so we'll ditch this instance.
            // This happens in paths to root when we generate arcs from a different set of calls.
            return;
        }

        // It checks to make sure the endpoints are extant, so we can fire it off right away.
         if(this.isEdgeForTemporaryRenderOnly(edge)){
            // Prefer check here than in caller
            return;
        }
        this.manifestEdge([edge], false);
    }
    
    /**
     * Can be used when the edge does not have both endpoints in the graph, or when removing
     * edges that were added only temporarily.
     */
    private registerImplicitEdge(edge: Link): Link{
        return this.expMan.edgeRegistry.addEdgeToRegistry(edge, this);
    }
    
    /**
     * Manifests any provided edges, but possibly not temporary edges, depending on arguments.
     */
    private manifestEdge(edges: Link[], allowTemporary: boolean){
         var edgesToRender: Link[] = [];
         var tempEdgesToRender: Link[] = [];
         $.each(edges,
            (index: number, edge: Link)=>{
                // Only ever manifest edges with endpoints in the graph
                var source = this.conceptIdNodeMap[String(edge.sourceId)];
                var target = this.conceptIdNodeMap[String(edge.targetId)];
                if(undefined === source || undefined === target || !this.nodeInGraph(source) || !this.nodeInGraph(target)){
                    return;
                }
                
                if(this.isEdgeForTemporaryRenderOnly(edge)){
                    if(!allowTemporary){
                        return;
                    } else {
                        tempEdgesToRender.push(edge);
                    }
                } else {
                    edgesToRender.push(edge);
                }
             }
         );
        
        if(!allowTemporary){
            this.graphView.stampTimeGraphModified();
        }
        
        // Add normal edges first
        this.addEdges(edgesToRender, false);
        
        // If we are allowing temporary, add any of those too
        if(allowTemporary){
            this.addEdges(tempEdgesToRender, true);
        }
    }
    
    public manifestEdgesForNewNode(conceptNode: Node){
        // Because registry contains edges for which there *was* no node for the index,
        // and there *are* nodes for the other ends of the edge, we can manifest all of
        /// them when we are doing so due to a new node appearing.
        var allEdges = this.expMan.edgeRegistry.getEdgesFor(conceptNode.nodeId);
        this.manifestEdge(allEdges, false);
    }
    
    private hasNonMappingEdgeAdjacent(nodeId: ConceptURI){
        return this.expMan.edgeRegistry.getEdgesFor(nodeId).some(
            (link: Link)=>{
                var source = this.conceptIdNodeMap[String(link.sourceId)];
                var target = this.conceptIdNodeMap[String(link.targetId)];
                if(undefined === source || undefined === target || !this.nodeInGraph(source) || !this.nodeInGraph(target)){
                    return false;
                } else {
                    return link.relationType !== this.relationLabelConstants.mapping;
                }
            }
        );
    }
    
    isEdgeForTemporaryRenderOnly(edge: Link) : boolean{
        // For mapping edges, if neither endpoint has triggered a mapping expansion, we won't
        // want to render the edge all the time.
        // But, now I also want to render mapping arcs that connect two nodes that each have
        // any non-mapping arc. Those nodes have higher relevance than a clustered cohort
        // of mutually mapped nodes, which would produce a hairball.
        
        if(edge.relationType === this.relationLabelConstants.mapping){
            if(this.expMan.wasConceptClearedForExpansion(edge.sourceId, PathOptionConstants.mappingsNeighborhoodConstant)
                || this.expMan.wasConceptClearedForExpansion(edge.targetId, PathOptionConstants.mappingsNeighborhoodConstant)
            ){
                // If one of the endpoints was expanded along mapping neighbourhood space, we will render the edge.
                return false;
            } else if(this.hasNonMappingEdgeAdjacent(edge.sourceId) && this.expMan.edgeRegistry.getEdgesFor(edge.targetId)){
                // If both endpoints are interesting (meaning, both have non-mapping edges attached),
                // then we will also render it.
                return false;
            } else {
                return true;
            }
        }
        
        return false;
    }
    

    manifestTemporaryHoverEdges(conceptNode: Node){
        var temporaryEdges = [];
        var nodeEdges = this.expMan.edgeRegistry.getEdgesFor(conceptNode.nodeId);
        // If clearedForMap, then technically all the mapping edges should be visible, so there's no reason to
        // look over the edges.
        var clearedForMap = this.expMan.wasConceptClearedForExpansion(conceptNode.nodeId, PathOptionConstants.mappingsNeighborhoodConstant);
        if(clearedForMap){
            return;
        }
        
        $.each(nodeEdges,
            (index: number, edge: Link )=>{
                if(edge.relationType === this.relationLabelConstants.mapping){
                    var otherNodeId = (edge.sourceId === conceptNode.nodeId) ? edge.targetId : edge.sourceId;
                    var otherNodeClearedMap = this.expMan.wasConceptClearedForExpansion(otherNodeId, PathOptionConstants.mappingsNeighborhoodConstant);
                    var otherNodeInGraph = this.conceptIdNodeMap[String(otherNodeId)] != null;
                    if(!otherNodeClearedMap && temporaryEdges.indexOf(edge) === -1
                        && otherNodeInGraph){
                        // If the other node is cleared, the edge should be already rendered.
                        temporaryEdges.push(edge);
                    }
                }
            }
        );
        
        this.manifestEdge(temporaryEdges, true);
    }
    
    // Safe to pass null for those in the know, but meeting an API by asking for the node.
    removeTemporaryHoverEdges(conceptNode: Node){
        var temporaryEdgesSelected = d3.selectAll("."+GraphView.BaseGraphView.temporaryEdgeClass);
        var temporaryEdgeData: Array<Link> = [];
        temporaryEdgesSelected.each(function(d: Link, i: number){
            temporaryEdgeData.push(d);
        });
        this.removeEdges(temporaryEdgeData, true);
    }
    
    /**
     * This is important because children and parent calls can result in the same relations
     * being returned. I am not yet confident that we only need one of these calls though.
     * I am concerned that they may not always return equivalent results.
     * 
     * @param edge
     * @returns {Boolean}
     */
    private edgeNotInGraph(edge: Link): boolean{
        var length = this.graphD3Format.links.length;
        for(var i = 0; i < length; i++) {
            var item = this.graphD3Format.links[i];
            if(item.sourceId === edge.sourceId && item.targetId === edge.targetId && item.relationType === edge.relationType){
                return false;
            }
        }
        return true;
    }
    
    private nodeInGraph(node: Node): boolean{
        return this.conceptIdNodeMap[(String)(node.nodeId)] !== undefined;
    }
    
    getAdjacentLinks(node: Node): Array<Link>{
        var adjacentEdges = [];
        var length = this.graphD3Format.links.length;
        for(var i = 0; i < length; i++) {
            var link = this.graphD3Format.links[i];
            if(link.source === node || link.target === node){
                adjacentEdges.push(link);
            }
        }
        return adjacentEdges;
    }

    /**
     * initSet is only passed so we can rename it when we have the core node's name
     */
    public fetchPathToRoot(centralOntologyAcronym: RawAcronym, centralConceptUri: SimpleConceptURI, expansionSet: ExpansionSets.ExpansionSet<Node>,
        initSet: CompositeExpansionDeletionSet.InitializationDeletionSet<Node>){
        // I have confirmed that this is faster than BioMixer. Without removing
        // network latency in REST calls, it is approximately half as long from page load to
        // graph completion (on the order of 11 sec vs 22 sec)
        // Tried web workers, but D3 doesn't play well with that, and they aren't appropriate
        // for REST call handling.
        
        /* Adding BioPortal data for ontology overview graph (mapping neighbourhood of a single ontology node)
        1) Get the root to path for the central concept
           http://data.bioontology.org/ontologies/SNOMEDCT/classes/http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FSNOMEDCT%2F82968002/paths_to_root/?format=jsonp&apikey=efcfb6e1-bcf8-4a5d-a46a-3ae8867241a1&callback=__gwt_jsonp__.P0.onSuccess
           - create the nodes, and do any prep for subsequent REST calls
        2) Get relational data (children, parents and mappings) for all concepts in the path to root
           http://data.bioontology.org/ontologies/SNOMEDCT/classes/http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FSNOMEDCT%2F82968002/parents/?format=jsonp&apikey=efcfb6e1-bcf8-4a5d-a46a-3ae8867241a1&callback=__gwt_jsonp__.P0.onSuccess
           - fill in nodes with details from this data TODO Look at Biomixer to see what we need 
        3) Get properties for all concepts in path to root
           http://data.bioontology.org/ontologies/SNOMEDCT/classes/http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FSNOMEDCT%2F82968002/properties/?format=jsonp&apikey=efcfb6e1-bcf8-4a5d-a46a-3ae8867241a1&callback=__gwt_jsonp__.P0.onSuccess
           - set node properties
        */
        
        // 1) Get paths to root for the central concept
        // Technically, the path to root does *not* use the normal wildfire expansion technique,
        // since we can get the full et of nodes to expand directly from the path to root REST call.
        // This mean that we don't need to enter the root node (nor path nodes) into the expansion registry...
        var pathsToRootUrl = this.buildPathToRootUrlNewApi(centralOntologyAcronym, centralConceptUri);
        // TODO Think about fetching the target node separately...we have to check for root node presence in the callback,
        // so we can associate the root node object with the expansion set as soon as possible.
        // Currently, it relies on the order of the results from the call, in order to get the
        // target node first.
        var pathsToRootCallback = new PathsToRootCallback(this, pathsToRootUrl, centralOntologyAcronym, centralConceptUri, expansionSet, initSet);
        var fetcher = new Fetcher.RetryingJsonFetcher(pathsToRootUrl);
        fetcher.fetch(pathsToRootCallback, true);
    }
    
    public expandConceptNeighbourhood(nodeData: Node, expansionSet: ExpansionSets.ExpansionSet<Node>){
        var centralConceptUrl = this.buildConceptUrlNewApi(nodeData.ontologyAcronym, nodeData.simpleConceptUri);
        var centralCallback = new FetchConceptRelationsCallback(this, centralConceptUrl, nodeData, PathOptionConstants.termNeighborhoodConstant, expansionSet);
        var fetcher = new Fetcher.RetryingJsonFetcher(centralConceptUrl);
        fetcher.fetch(centralCallback, true);
    }
    
    public expandMappingNeighbourhood(nodeData: Node, expansionSet: ExpansionSets.ExpansionSet<Node>){
        // Cannot just call fetchMappings() directly because we need the link from the base concept URL
        this.removeTemporaryHoverEdges(null); // (nodeData);
        var centralConceptUrl = this.buildConceptUrlNewApi(nodeData.ontologyAcronym, nodeData.simpleConceptUri);
        var centralCallback = new FetchConceptRelationsCallback(this, centralConceptUrl, nodeData, PathOptionConstants.mappingsNeighborhoodConstant, expansionSet);
        var fetcher = new Fetcher.RetryingJsonFetcher(centralConceptUrl);
        fetcher.fetch(centralCallback, true);
    }
    
    /**
     * initSet is only passed so we can rename it when we have the core node's name
     */
    public fetchTermNeighborhood(centralOntologyAcronym: RawAcronym, centralConceptUri: SimpleConceptURI, expansionSet: ExpansionSets.ExpansionSet<Node>,
        initSet: CompositeExpansionDeletionSet.InitializationDeletionSet<Node>){
        // 1) Get term neighbourhood for the central concept by fetching term and marking it for expansion
        // Parsers that follow will expand neighbourhing concepts.
        var centralConceptUrl = this.buildConceptUrlNewApi(centralOntologyAcronym, centralConceptUri);
        var centralCallback = new FetchTargetConceptCallback(this, centralConceptUrl, centralConceptUri, PathOptionConstants.termNeighborhoodConstant, expansionSet, initSet);
        var fetcher = new Fetcher.RetryingJsonFetcher(centralConceptUrl);
        fetcher.fetch(centralCallback, true);
    }
    
    /**
     * initSet is only passed so we can rename it when we have the core node's name
     */
    public fetchMappingsNeighborhood(centralOntologyAcronym: RawAcronym, centralConceptUri: SimpleConceptURI, expansionSet: ExpansionSets.ExpansionSet<Node>,
        initSet: CompositeExpansionDeletionSet.InitializationDeletionSet<Node>){
        // Should I call the mapping, inferring the URL, or should I call for the central node, add it, and use conditional expansion in the relation parser?
        // http://data.bioontology.org/ontologies/SNOMEDCT/classes/http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FSNOMEDCT%2F410607006/mappings/?apikey=efcfb6e1-bcf8-4a5d-a46a-3ae8867241a1&callback=__gwt_jsonp__.P109.onSuccess
        
        // Get central concept immediately, and let the relation parser that will be called expand
        // related nodes conditioned on whether their related node is this to-be-expanded one.
        // Loading that node will get the mappings, and subsequently the concepts mapped to.
        // The mapping parser will fetch individual mapped concepts as it finds them by checking to see
        // if we are in the mapping visualization. I could make this explicit by copying the mappings code
        // here, but then we have duplicate code. If we decide it reads poorly to have it so detached
        // in the process, we can copy it here.
        var centralConceptUrl = this.buildConceptUrlNewApi(centralOntologyAcronym, centralConceptUri);
        var centralCallback = new FetchTargetConceptCallback(this, centralConceptUrl, centralConceptUri, PathOptionConstants.mappingsNeighborhoodConstant, expansionSet, initSet);
        var fetcher = new Fetcher.RetryingJsonFetcher(centralConceptUrl);
        fetcher.fetch(centralCallback, true);
    }
    
    public fetchConceptRelations(conceptNode: Node, conceptData: NodeData, expansionSet: ExpansionSets.ExpansionSet<Node>, directCallForExpansionType?: PathOption){
        // 2) Get relational data for all the concepts, create links from them
        // fetchBatchRelations(); // don't exist, because of COR issues on server, cross domain, and spec issues.
        
        // Children requests have paging, which needs cycling internally.
        // If the PathOptions argument is compatible with any of the below methods, it wil auto-expand
        // the nodes therein.
        this.fetchChildren(conceptNode, conceptData.links.children, 1, directCallForExpansionType, expansionSet);
        this.fetchParents(conceptNode, conceptData.links.parents, directCallForExpansionType, expansionSet);
        this.fetchMappings(conceptNode, conceptData.links.mappings, directCallForExpansionType, expansionSet);
        this.fetchCompositionRelations(conceptNode, directCallForExpansionType, expansionSet);
    }
    
    fetchChildren(conceptNode: Node, relationsUrl: string, pageRequested: number, directCallForExpansionType: PathOption, expansionSet: ExpansionSets.ExpansionSet<Node>){
        var giveUserBusyIndicator;
        if(directCallForExpansionType === PathOptionConstants.termNeighborhoodConstant){
            giveUserBusyIndicator = true;
        } else {
            giveUserBusyIndicator = false;
        }
        // Children requests have paging, which needs cycling internally.
        relationsUrl = Utils.addOrUpdateUrlParameter(relationsUrl, "page", pageRequested+"");
        var conceptRelationsCallback = new ConceptChildrenRelationsCallback(this, relationsUrl, conceptNode, this.conceptIdNodeMap, directCallForExpansionType, expansionSet);
        var fetcher = new Fetcher.RetryingJsonFetcher(relationsUrl);
        fetcher.fetch(conceptRelationsCallback, giveUserBusyIndicator);
    }
    
    fetchParents(conceptNode: Node, relationsUrl: string, directCallForExpansionType: PathOption, expansionSet: ExpansionSets.ExpansionSet<Node>){
        var giveUserBusyIndicator;
        if(directCallForExpansionType === PathOptionConstants.termNeighborhoodConstant){
            giveUserBusyIndicator = true;
        } else {
            giveUserBusyIndicator = false;
        }
        var conceptRelationsCallback = new ConceptParentsRelationsCallback(this, relationsUrl, conceptNode, this.conceptIdNodeMap, directCallForExpansionType, expansionSet);
        var fetcher = new Fetcher.RetryingJsonFetcher(relationsUrl);
        fetcher.fetch(conceptRelationsCallback, giveUserBusyIndicator);
    }
    
    fetchMappings(conceptNode: Node, relationsUrl: string, directCallForExpansionType: PathOption, expansionSet: ExpansionSets.ExpansionSet<Node>){
        var giveUserBusyIndicator;
        if(directCallForExpansionType === PathOptionConstants.mappingsNeighborhoodConstant){
            giveUserBusyIndicator = true;
        } else {
            giveUserBusyIndicator = false;
        }
        var conceptRelationsCallback = new ConceptMappingsRelationsCallback(this, relationsUrl, conceptNode, this.conceptIdNodeMap, directCallForExpansionType, expansionSet);
        var fetcher = new Fetcher.RetryingJsonFetcher(relationsUrl);
        fetcher.fetch(conceptRelationsCallback, giveUserBusyIndicator);
    }
    
     fetchCompositionRelations(conceptNode: Node, directCallForExpansionType: PathOption, expansionSet: ExpansionSets.ExpansionSet<Node>){
        var giveUserBusyIndicator;
        if(directCallForExpansionType === PathOptionConstants.termNeighborhoodConstant){
            giveUserBusyIndicator = true;
        } else {
            giveUserBusyIndicator = false;
        }
        // NB Within the parsing call, we will get the ontology's property based relations (composition plus others) if it isn't fetched.
        // That's only a single call per ontology, but it does delay the properties call until that other call is made first.
        // Since all we use the properties for at the moment is composite and these other relations, that's an ok delay.
        var relationsUrl = this.buildConceptCompositionsRelationUrl(conceptNode);
        var conceptRelationsCallback = new ConceptCompositionRelationsCallback(this, relationsUrl, conceptNode, this.conceptIdNodeMap, directCallForExpansionType, expansionSet);
        var fetcher = new Fetcher.RetryingJsonFetcher(relationsUrl);
        fetcher.fetch(conceptRelationsCallback, giveUserBusyIndicator);
        
    }
    
    // http://data.bioontology.org/ontologies/SNOMEDCT/classes/http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FSNOMEDCT%2F82968002/paths_to_root/?format=jsonp&apikey=efcfb6e1-bcf8-4a5d-a46a-3ae8867241a1&callback=__gwt_jsonp__.P0.onSuccess
    buildPathToRootUrlNewApi(centralOntologyAcronym: RawAcronym, centralConceptUri: SimpleConceptURI){
        // String() converts object String back to primitive string. Go figure.
        return "http://"+Utils.getBioportalUrl()+"/ontologies/"+centralOntologyAcronym+"/classes/"+encodeURIComponent(String(centralConceptUri))+"/paths_to_root/";
    }
    
    // This is unused. See description. Leaving as documentation.
    buildTermNeighborhoodUrlNewApi(centralOntologyAcronym: RawAcronym, centralConceptUri: SimpleConceptURI){
        // Term neighborhood requires the core concept call, then properties, mappings, children and parents (in no particular order).
        // Since those all need to be called for *any* node being loaded, this visualization mode relies upon cascading expansion as
        // relations are parsed. Thus, the URL for this call is really just a concept node URL. The subsquent functions
        // will check the visualization mode to decide whether they are expanding the fetched relations or not.
        // String() converts object String back to primitive string. Go figure.
        return this.buildConceptUrlNewApi(centralOntologyAcronym, centralConceptUri);
    }
    
    // This might be unused, because we may navigate to the mappings URL along the link data provided from the new API.
    buildMappingsNeighborhoodUrlNewApi(centralOntologyAcronym: RawAcronym, centralConceptUri: SimpleConceptURI){
        // From the mappings results, we add all of the discovered nodes.
        // String() converts object String back to primitive string. Go figure.
        return "http://"+Utils.getBioportalUrl()+"/ontologies/"+centralOntologyAcronym+"/classes/"+encodeURIComponent(String(centralConceptUri))+"/mappings/";
    }
    
    buildConceptUrlNewApi(ontologyAcronym: RawAcronym, conceptUri: SimpleConceptURI){
        // String() converts object String back to primitive string. Go figure.
        //        return "http://"+Utils.getBioportalUrl()+"/ontologies/"+ontologyAcronym+"/classes/"+encodeURIComponent(String(conceptUri));
        
        // Using include=properties,definition,synonyms gets us the same info, with fewer REST calls, without too much
        // cost in latency.
        return this.buildConceptCompositionsRelationUrl(null, ontologyAcronym, conceptUri);
    }
    
    buildConceptSearchUrlNewApi(conceptUri: SimpleConceptURI){
        // String() converts object String back to primitive string. Go figure.
        return "http://"+Utils.getBioportalUrl()+"/search/?require_exact_match=true&also_search_properties=false&q="+encodeURIComponent(String(conceptUri));
    }
    
    buildConceptCompositionsRelationUrl(concept: Node, ontologyAcronym?: RawAcronym, conceptUri?: SimpleConceptURI){
        if(null != concept){
            ontologyAcronym = concept.ontologyAcronym
            conceptUri = concept.simpleConceptUri;
        }
        return "http://"+Utils.getBioportalUrl()+"/ontologies/"+ontologyAcronym+"/classes/"+encodeURIComponent(String(conceptUri))
        +"?include=properties,definition,synonym,prefLabel";
        //        +"?include=properties";
    }
    
    //If we can use batch calls for the parent, child and mappings of each node, we save 2 REST calls per node.
    //If we can use batch calls for parent, child, and mapping for several nodes, we save a lot more, but the response
    //size and response times might be too long. We can use bulk asking for just one of the three relational data
    //properties.
    //Nodes also need a properties call each, which might be done in bulk.
    buildBatchRelationUrl(concept: Node){
        // Unused currently due to specification issues
        // 400-800 for children, properties each, 500-900 for parents, 500-900 for mappings
        // 500-1.2s for all four combined. Looks like savings to me.
        return "http://"+Utils.getBioportalUrl()+"/ontologies/"+concept.ontologyAcronym+"/classes/"+concept.conceptUriForIds
        +"?include=children,parents,mappings,properties";
    }
    
    buildBatchRelationUrlAndPostData(concepts: Array<Node>){
        // Given a set of concepts, create a batch API call to retrieve their parents, children and mappings
        // http://stagedata.bioontology.org/documentation#nav_batch
        var url = "http://"+Utils.getBioportalUrl()+"/batch/";
        // TEMP TEST
        // url = "http://stagedata.bioontology.org/batch?";
        var classCollection = [];
        var postObject: any = {
                "http://www.w3.org/2002/07/owl#Class": {
                    "collection": classCollection
                    },
                "include": "children, parents, mappings, properties",
                
        };
        $.each(concepts, function(i, d){
            classCollection.push({
                "class": d.id, // unescaped uri
                "ontology": d.ontologyUri, // unescaped uri
            });
        });
    //  console.log(postObject);
        
        // TEMP TEST
        postObject = {
                "http://www.w3.org/2002/07/owl#Class": {
                    "collection": [
                                   {
                                        "class": "http://bioontology.org/ontologies/BiomedicalResourceOntology.owl#Information_Resource",
                                        "ontology": "http://bioontology.org/ontologies/BiomedicalResourceOntology.owl#"
                                   },
                                   {
                                       "class": "http://bioontology.org/ontologies/BiomedicalResourceOntology.owl#Data_Resource",
                                       "ontology": "http://bioontology.org/ontologies/BiomedicalResourceOntology.owl#"
                                   },
                                   {
                                       "class": "http://bioontology.org/ontologies/BiomedicalResourceOntology.owl#Clinical_Care_Data",
                                       "ontology": "http://bioontology.org/ontologies/BiomedicalResourceOntology.owl#"
                                   },
                                   {
                                       "class": "http://bioontology.org/ontologies/BiomedicalResourceOntology.owl#Aggregate_Human_Data",
                                       "ontology": "http://bioontology.org/ontologies/BiomedicalResourceOntology.owl#"
                                   }
                                   ],
                "include": "prefLabel,synonym"   
                }
        };
        
        return {
                "url": url,
                "data": postObject,
                };
    }

     // Graph is responsible for its own node coloration...debate what this is: model attribute or view render?
    // In D3, the data model gets mingled with the view in this kind of way, so I feel this is ok.
    currentNodeColor: number = -1;
    nodeOrderedColors = d3.scale.category20().domain([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]);
    ontologyColorMap = {};
    nextNodeColor(ontologyRawAcronym: RawAcronym){
        var ontologyAcronym: string = String(ontologyRawAcronym);
        if(!(ontologyAcronym in this.ontologyColorMap)){
            this.currentNodeColor = this.currentNodeColor == 19 ? 0 : this.currentNodeColor + 1;
            this.ontologyColorMap[ontologyAcronym] = this.nodeOrderedColors(this.currentNodeColor);
        }
        return this.ontologyColorMap[ontologyAcronym];
        
    }
    
    brightenColor(outerColor){
        // Outer color will be a 6 digit hex representation. Let's make it darker across all three factors.
        // Using lab() converts from hex RGB to the Cie L*A*B equivalent.
        return d3.lab(outerColor).brighter(1).toString();
    }
    
    darkenColor(outerColor){
        // Outer color will be a 6 digit hex representation. Let's make it darker across all three factors.
        // Using lab() converts from hex RGB to the Cie L*A*B equivalent.
        return d3.lab(outerColor).darker(1).toString();
    }
    
}

class PathsToRootCallback extends Fetcher.CallbackObject {
    
    constructor(
        public graph: ConceptGraph, // shadowing
        url: string,
        public centralOntologyAcronym: RawAcronym,
        public centralConceptUri: SimpleConceptURI,
        public expansionSet: ExpansionSets.ExpansionSet<Node>,
        public initSet: CompositeExpansionDeletionSet.InitializationDeletionSet<Node>
        ){
            super(url, String(centralOntologyAcronym)+":"+String(centralConceptUri), Fetcher.CallbackVarieties.nodesMultiple);
        }
        
    public callback = (pathsToRootData: any, textStatus: string, jqXHR: any) => {
        // textStatus and jqXHR will be undefined, because JSONP and cross domain GET don't use XHR.
        // CORS enabled GET and POST do though!
        if(jqXHR != null){
            if(pathsToRootData.errors != null){
                // We had an error. Handle it.
                // Well...in this case, if there's an error, there's not much to do.
                // TODO Give user a message sayign the operation failed
                console.log("Failed to load paths to root: "+this.centralConceptUri);
                return;
            }
        }
        
        var numberOfConcepts = Object.keys(pathsToRootData).length;
        var newNodesForExpansionGraph: {[id: string]: Node} = {};
        // Go backwards through results to get the target node first, so we can have it immediately for
        // the expansion set parent.
        var collapsedPathsToRootData: {[key: string]: any} = {};
        for(var pathIndex = 0; pathIndex < pathsToRootData.length; pathIndex++){
            for(var conceptIndex = pathsToRootData[pathIndex].length - 1; conceptIndex >= 0; conceptIndex--){
                var nodeData = pathsToRootData[pathIndex][conceptIndex];
                var newNodeId = String(this.graph.computeNodeId(nodeData));
                if(newNodesForExpansionGraph[newNodeId] === undefined){
                    var conceptNode = this.graph.parseNode(undefined, nodeData, this.expansionSet);
                    
                    if(null == conceptNode){
                        // I feel like...if the ontology happens to have one of the deformed ids
                        // as a parent, and has valid parents above it, that we need to keep the
                        // deformed node (with just it's id) as a stand in, for structural purposes.
                        // But, given these concepts don't have things like subClassOf properties (by
                        // virtue of not existing in Bioportal), it might be that they will not have
                        // accessible parents in the paths to root set anyway...
                        continue;
                    }
                    
                    if(conceptNode.simpleConceptUri === this.centralConceptUri){
                        this.expansionSet.parentNode = conceptNode;
                        if(this.initSet !== null){
                            this.initSet.updateExpansionNodeDisplayName(conceptNode.name+" ("+conceptNode.ontologyAcronym+")");
                        }
                    }
                    newNodesForExpansionGraph[conceptNode.getEntityId()] = conceptNode;
                    collapsedPathsToRootData[conceptNode.getEntityId()] = nodeData;
                }
                // Regardless of whether we had to parse this node in the current loop or not, 
                // we need to identify it and get path arcs prepared. We may have parsed it in a previous
                // iteration.
                var currentNode = newNodesForExpansionGraph[newNodeId];
                // Create link between this node and its predecessor within the current path
                // Note that the multiple paths are single-inheritance, that is, within each pathsToRootData
                // index, we have a single lineage. Thus, any predecessor in the array is a child of the node
                // we are currently working with.
                var parentIndex = conceptIndex + 1; // we are in a decrementing loop. Parent is larger index.
                if(parentIndex < pathsToRootData[pathIndex].length){
                    var parentData = pathsToRootData[pathIndex][parentIndex];
                    var parentNodeId = String(this.graph.computeNodeId(parentData));
                    var parentNode = newNodesForExpansionGraph[parentNodeId];
                    // Note also that normally when we parse for arcs, we will parse for the node if possible. Since
                    // we go in reverse order, the parent has already been parsed and is known to us.
                    var conceptRelationsCallback = new ConceptParentsRelationsCallback(this.graph, "", parentNode, this.graph.conceptIdNodeMap, PathOptionConstants.pathsToRootConstant, this.expansionSet);
                    conceptRelationsCallback.callback([nodeData], textStatus, jqXHR);
                    
                }
            }
        }

        // Normally, dispatching relations would be a priority, but we have child-parent relations
        // implicit in the paths to root data, and we want that parsed ASAP. Then we can ask for the
        // remaining relations.
        for(var nodeId in newNodesForExpansionGraph){
            var node = newNodesForExpansionGraph[nodeId];
            var data = collapsedPathsToRootData[node.getEntityId()];
            // No busy indicator here because we have our path of nodes already
            this.graph.fetchConceptRelations(node, data, this.expansionSet);
        }
    };
}

class FetchTargetConceptCallback extends Fetcher.CallbackObject {
    
    constructor(
        public graph: ConceptGraph,
        url: string,
        public conceptUri: SimpleConceptURI,
        public directCallForExpansionType: PathOption,
        public expansionSet: ExpansionSets.ExpansionSet<Node>,
        public initSet: CompositeExpansionDeletionSet.InitializationDeletionSet<Node>
        ){
            super(url, String(conceptUri), Fetcher.CallbackVarieties.nodeSingle); //+":"+directCallForExpansionType);
        }
    
    public callback = (conceptPropertiesData: any, textStatus: string, jqXHR: any) => {
        // textStatus and jqXHR will be undefined, because JSONP and cross domain GET don't use XHR.
        // CORS enabled GET and POST do though!
        if(jqXHR != null){
            if(conceptPropertiesData.errors != null){
                // We had an error. Handle it.
                // Well...in this case, if there's an error, there's not much to do.
                // TODO Give user a message sayign the operation failed
                console.log("Failed to load target node: "+this.conceptUri);
                return;
            }
        }
        

        var conceptNode = this.graph.parseNode(undefined, conceptPropertiesData, this.expansionSet);
        if(null == conceptNode){
            return;
        }
        
        // This is the vital difference from the FetchOneConceptCallback
        this.expansionSet.parentNode = conceptNode;
        
        if(this.initSet !== null){
            this.initSet.updateExpansionNodeDisplayName(conceptNode.name+" ("+conceptNode.ontologyAcronym+")");
        }

        // As we grab related concepts, we might expand them if their relation matches the expansion we are using.
        // TODO The indicator isn't necessarily true it should be so only for the expansion-matching relation call.
        console.log("Fix to make optional or default...or allow null...to defer decisions of busy indicator to sub-fetchers");
        this.graph.fetchConceptRelations(conceptNode, conceptPropertiesData, this.expansionSet, this.directCallForExpansionType);
    }
}

export class FetchOneConceptCallback extends Fetcher.CallbackObject {
    
    public directCallForExpansionType: PathOption = PathOptionConstants.singleNodeOrSubordinateConstant;
    
    constructor(
        public graph: ConceptGraph,
        url: string,
        public conceptUri: ConceptURI,
        public expansionSet: ExpansionSets.ExpansionSet<Node>
        ){
            super(url, String(conceptUri), Fetcher.CallbackVarieties.nodeSingle); //+":"+directCallForExpansionType);
        }
        
    public callback = (conceptPropertiesData: any, textStatus: string, jqXHR: any) => {
        // textStatus and jqXHR will be undefined, because JSONP and cross domain GET don't use XHR.
        // CORS enabled GET and POST do though!
        if(jqXHR != null){
            if(conceptPropertiesData.errors != null){
                // We had an error. Handle it.
                this.graph.expMan.purgeInaccessibleNode(this.conceptUri);
                return;
            }
        }
        

        var fetchCall = ()=>{
            var conceptNode = this.graph.parseNode(undefined, conceptPropertiesData, this.expansionSet);
            if(null == conceptNode){
                return;
            }
            // As we grab related concepts, we might expand them if their relation matches the expansion we are using.
            this.graph.fetchConceptRelations(conceptNode, conceptPropertiesData, this.expansionSet);
        }
        
        // Removed cap check within FetchOneConceptCallback, because it is better to check prior to this.
        // Used to conditionally check the cap on the basis of incoming argument.
        fetchCall();
    }
}

export class SearchOneConceptCallback extends Fetcher.CallbackObject {
    
    public directCallForExpansionType: PathOption = PathOptionConstants.singleNodeConstant;
    
    constructor(
        public graph: ConceptGraph,
        url: string,
        public conceptUri: SimpleConceptURI,
        public priorityLoadNoCapCheck: boolean = false
        ){
            super(url, String(conceptUri), Fetcher.CallbackVarieties.nodeSingle); //+":"+directCallForExpansionType);
        }
        
    public callback = (conceptMatchData: any, textStatus: string, jqXHR: any) => {
        // textStatus and jqXHR will be undefined, because JSONP and cross domain GET don't use XHR.
        // CORS enabled GET and POST do though!
        if(jqXHR != null){
            if(conceptMatchData.errors != null){
                // We had an error. Handle it.
                // This error could represent a totally invalid id, and we don't know the ontology
                // the potential node belongs to anyway. Thus, we won't purge it.
                // this.graph.expMan.purgeInaccessibleNode(this.conceptUri);
                return;
            }
        }
        
        
        // Even though we expect few nodes to match, we still will check the cap.
        var conceptPropertiesData = [];
        for(var i in conceptMatchData.collection){
            // This approach is optimistic; there are paged search results, but if I require
            // an exact hit, we should get an exact hit, shouldn't we?
            // http://data.bioontology.org/search?q=http://purl.obolibrary.org/obo/UBERON_0018255
            var hit = conceptMatchData.collection[i];
            if(hit.matchType === "id" && hit["@id"]===this.conceptUri){
                conceptPropertiesData.push(hit);
            }
        }
        if(conceptPropertiesData.length == 0){
            alert("Failed to import node for provided id: '"+this.conceptUri+"'");
            // this.graph.undoBoss.removeCommand(this.expansionSet.graphModifier);
            return;
        } else {
            var expId = new ExpansionSets.ExpansionSetIdentifer("arbitraryConceptAddition_"+Utils.escapeIdentifierForId(this.conceptUri), "Added Arbitrary Node");
            var expansionSet = new ExpansionSets.ExpansionSet(expId, null, this.graph, this.graph.expMan.getActiveExpansionSets(), this.graph.undoBoss, PathOptionConstants.singleNodeConstant);
            var lastConceptNode: Node;
            var lastConceptNodeData;
            var fetchCall = (maxNodesToGet: number): number=>{
                for(var j = 0; j < conceptPropertiesData.length; j++){
                    if(j >= maxNodesToGet){
                        break;
                    }
                    lastConceptNodeData = conceptPropertiesData[j];
                    var node = this.addNode(lastConceptNodeData, expansionSet);
                    if(null !== node){
                        lastConceptNode = node;
                    }
                }
                if(expansionSet.nodes.length === 1){
                    expansionSet.id.setDisplayId(expansionSet.id.getDisplayId()+" ("+lastConceptNode.ontologyAcronym+")");
                } else {
                    expansionSet.id.setDisplayId(expansionSet.id.getDisplayId()+" (multiple ontologies)");
                }
                
                return j;
            }
            // var ontologyUri = conceptData.links.ontology;
            // Check cap using the last node we found in the search results.
            var lastNodeId = this.graph.computeNodeId(conceptPropertiesData[0]);
            this.graph.checkForNodeCap(fetchCall, expansionSet, conceptPropertiesData.length);
        }
    };
    
    private addNode(conceptPropertiesData, expansionSet: ExpansionSets.ExpansionSet<Node>){
        var conceptNode = this.graph.parseNode(undefined, conceptPropertiesData, expansionSet);
        if(null == conceptNode){
            return null;
        }
        
        if(expansionSet.nodes.length === 0){
            expansionSet.id.setDisplayId("Added: "+conceptNode.name);
        }
                
        // As we grab related concepts, we might expand them if their relation matches the expansion we are using.
        this.graph.fetchConceptRelations(conceptNode, conceptPropertiesData, expansionSet);
        
        return conceptNode;
    }
}

/**
 * Similar to FetchOneConcept, except for when we knwo we have the node already.
 */
class FetchConceptRelationsCallback extends Fetcher.CallbackObject {
    
    constructor(
        public graph: ConceptGraph,
        url: string,
        public node: Node,
        public directCallForExpansionType: PathOption,
        public expansionSet: ExpansionSets.ExpansionSet<Node>
        ){
            // Arguably we could call this a nodesMultiple CallbackVariety...
            super(url, String(node.nodeId), Fetcher.CallbackVarieties.links); //+":"+directCallForExpansionType);
        }
        
    public callback = (conceptPropertiesData: any, textStatus: string, jqXHR: any) => {
        // textStatus and jqXHR will be undefined, because JSONP and cross domain GET don't use XHR.
        // CORS enabled GET and POST do though!
        if(jqXHR != null){
            if(conceptPropertiesData.errors != null){
                // We had an error. Handle it.
                // No relations available? Why not? I'm not sure how to recover.
                return;
            }
        }
        
        // As we grab related concepts, we might expand them if their relation matches the expansion we are using.
        this.graph.fetchConceptRelations(this.node, conceptPropertiesData, this.expansionSet, this.directCallForExpansionType);
    }
}
    
// currently oriented to grabbing data for a single concept. Might do batch later when that works server side
// for cross domain requests.
// Can process mapping, parent, properties, and children, even if not all are passed in.
// This is useful given that parents don't show up if children are requested.
class ConceptCompositionRelationsCallback extends Fetcher.CallbackObject {
    
    constructor(
        public graph: ConceptGraph,
        url: string,
        public conceptNode: Node,
        public conceptNodeIdMap: ConceptIdMap,
        public directCallForExpansionType: PathOption,
        public expansionSet: ExpansionSets.ExpansionSet<Node>
        ){
            super(url, String(conceptNode.nodeId), Fetcher.CallbackVarieties.links); //+":"+directCallForExpansionType);
        }

    public callback = (relationsDataRaw: any, textStatus: string, jqXHR: any) => {
        // textStatus and jqXHR will be undefined, because JSONP and cross domain GET don't use XHR.
        // CORS enabled GET and POST do though!
        if(jqXHR != null){
            if(relationsDataRaw.errors != null){
                // We had an error. Handle it.
                // No relations available? Why not? I'm not sure how to recover.
                return;
            }
        }
        
        var outerThis = this;
        // Before we parse this data, we have to make sure we have fetched the correpsonding
        // ontology's property relations data. This tells us what properties exist that 
        // represent relations that we can add as arcs.
        // If we don't have that data yet, tell the registry, and provide a callback to come right back
        // here. The registry will get the required info, then call back to here.
        if(!PropRel.OntologyPropertyRelationsRegistry.contains(this.conceptNode.ontologyAcronym)){
            PropRel.OntologyPropertyRelationsRegistry.fetchOntologyPropertyRelations(
                this.conceptNode,
                ()=>{
                    // We wrap the callbkac we are currently in, so that we can re-enter it later
                    // when we have the necessary ontology data.
                    this.callback(relationsDataRaw, textStatus, jqXHR);
                }
            );
            return;
        }
        
        // NB The part_of and has_part relations below are based on SNOMEDCT (and possibly other)
        // property relations that were in the very oldest versions of Biomixer. With the API call
        // for relational properties now available, these non-inheritance relations will become
        // more common and diverse, in ontologies that publish the properties.
        // Note that at the time of writing, SNOMEDCT does not provide any relation properties,
        // but when we get the properties for concepts, we find has_part and part_of (as well as
        // other apparent relations, such as has_laterality). I am keeping the two hard coded ones here,
        // and using published property relations for additional arc types.
        
        // Loop over results, properties, then mappings, parents, children.
        var funcsToCall = [];
        $.each(relationsDataRaw.properties,
            (propertyId, propertyValue)=>{
                // NB Composition relations can only be parsed from properties received with the "include=properties"
                // parameter. This means that although properties are received elsewhere (path to root, children),
                // those property sets never give us the composition relations. 
                // But...children property sets do have all the other things we need to get the seed of data for a node
                // (being the @id and the ontology link from which we need to extract the true-and-valid ontology acronym)
            
                // We also have some grandfathered special cases. Has_part and part_of show up at least in SNOMDED, but without
                // a corresponding relation property definition on the ontology itself. We can keep that,. but we can't double parse
                // said relation on other ontologies that do have a relation property definition.
                

                // This meta data (http://data.bioontology.org/metadata/treeView) is not useful for graphs.
                // There could be other metadata like this though...
                if(Utils.endsWith(propertyId, "treeView")){
                    return;
                }
                
                // Check for ontology declared property relations.
                var matchedRelationProp = PropRel.OntologyPropertyRelationsRegistry.matchedAvailableRelations(this.conceptNode.ontologyAcronym, propertyId); // used to be the entry or index..."medial ligament", etc
                // want label for the arc name, want idEscaped for the id...where am I getting the actual concept that is related?
                if(matchedRelationProp !== undefined){
                    $.each(propertyValue, (i, relatedPartId: SimpleConceptURI)=>{
                        if(relatedPartId.indexOf("http") !== 0){
                            // Non-relational properties do indeed appear in the ontology property results.
                            // If it isn't a concept URI, we will skip it.
                            // Just skipping non-uris is not even adequate, since there could be additional non-concept
                            // uris used. I don't think there is an automated way of knowing which properties are
                            // actually relational.
                            // console.log("Skipped '"+relatedPartId+"' ("+propertyId+")");
                            return;
                        }
                        var newRelatedNodeId = this.graph.computeNodeId(relatedPartId, this.conceptNode.ontologyAcronym);
                        this.graph.manifestOrRegisterImplicitRelation(this.conceptNode.nodeId, newRelatedNodeId, matchedRelationProp.idEscaped, matchedRelationProp);
                        if(this.graph.nodeMayBeExpanded(newRelatedNodeId, this.conceptNode.nodeId, PathOptionConstants.termNeighborhoodConstant, this.expansionSet)){
                            funcsToCall.push(()=>{
                            this.graph.expandRelatedConcept(this.conceptNode.ontologyAcronym, relatedPartId, this.conceptNode.nodeId, PathOptionConstants.termNeighborhoodConstant, this.expansionSet);
                            });
                        }
                    });
                    return;
                }
                
                // See line 71 TermWithoutRelationsJsonParser for how it was dealt with in Java.
                // We already parsed for other (automatic) properties when we first got this node's
                // data, so here we only do composite relations and maybe additional properties if needed.
                // This is properties such as: "http://purl.bioontology.org/ontology/SNOMEDCT/has_part"
                // I know, not the most general property name...
                if(Utils.endsWith(propertyId, "has_part")){
                    $.each(propertyValue, (index, childPartId: SimpleConceptURI)=>{
                        // TODO Need to register all node ids we get, so that for the different visualizations, we can expand differently.
                        // For path to root, we only expand those path to root nodes (determined at beginning)
                        // For term neighbourhood, we only expand the direct neighbours of the central node (determined during fetches).
                        // For mappings, we only expand based on the first mapping call (determined during fetches).
                        // Ergo, we need to expand composition mappings if we are in the term neighbourhood vis.
                        
                        // PROBLEM Seems like I want to manifest nodes before doing arcs, but in this case, I want to know
                        // if the relation exists so I can fetch the node data...
                        var newChildNodeId = this.graph.computeNodeId(childPartId, this.conceptNode.ontologyAcronym);
                        this.graph.manifestOrRegisterImplicitRelation(this.conceptNode.nodeId, newChildNodeId, this.graph.relationLabelConstants.composition);
                        
                        if(this.graph.nodeMayBeExpanded(newChildNodeId, this.conceptNode.nodeId, PathOptionConstants.termNeighborhoodConstant, this.expansionSet)){
                            funcsToCall.push(()=>{
                                this.graph.expandRelatedConcept(this.conceptNode.ontologyAcronym, childPartId, this.conceptNode.nodeId, PathOptionConstants.termNeighborhoodConstant, this.expansionSet);
                            });
                        }
                        
                    });
                    return;
                }
                
                if(Utils.endsWith(propertyId, "part_of")){
                    $.each(propertyValue, (index, parentPartId: SimpleConceptURI)=>{
                        var newParentNodeId = this.graph.computeNodeId(parentPartId, this.conceptNode.ontologyAcronym);
                        this.graph.manifestOrRegisterImplicitRelation(newParentNodeId, this.conceptNode.nodeId, this.graph.relationLabelConstants.composition);
                        
                        if(this.graph.nodeMayBeExpanded(newParentNodeId, this.conceptNode.nodeId, PathOptionConstants.termNeighborhoodConstant, this.expansionSet)){
                            funcsToCall.push(()=>{
                                this.graph.expandRelatedConcept(this.conceptNode.ontologyAcronym, parentPartId, this.conceptNode.nodeId, PathOptionConstants.termNeighborhoodConstant, this.expansionSet);
                            });
                        }
                    });
                    return;
                }
                
            }
        );
        
        if(funcsToCall.length === 0){
            return;
        }
        
        var fetchCall = (maxToAdd: number): number=>{
            var numAdded = 0;
            $.each(funcsToCall,
                (i: number, propertyRelationFunc)=>{
                    if(null != maxToAdd && numAdded >= maxToAdd){
                        return;
                    }
                    numAdded++;
                    propertyRelationFunc();
                }
            );
            return numAdded;
        };
            
        this.graph.checkForNodeCap(fetchCall, this.expansionSet, funcsToCall.length);
        
    }
}
        
class ConceptChildrenRelationsCallback extends Fetcher.CallbackObject {
    
    constructor(
        public graph: ConceptGraph,
        url: string,
        public conceptNode: Node,
        public conceptIdNodeMap: ConceptIdMap,
        public directCallForExpansionType: PathOption,
        public expansionSet: ExpansionSets.ExpansionSet<Node>
        ){
            super(url, String(conceptNode.nodeId), Fetcher.CallbackVarieties.nodesMultiple); //+":"+directCallForExpansionType);
        }
        
    public callback = (relationsDataRaw: any, textStatus: string, jqXHR: any) => {
        // textStatus and jqXHR will be undefined, because JSONP and cross domain GET don't use XHR.
        // CORS enabled GET and POST do though!
        if(jqXHR != null){
            if(relationsDataRaw.errors != null){
                // We had an error. Handle it.
                // No relations available? Why not? I'm not sure how to recover.
                return;
            }
        }
        
        // Example: http://data.bioontology.org/ontologies/SNOMEDCT/classes/http%3A%2F%2Fpurl.bioontology.org%2Fontology%2FSNOMEDCT%2F91837002/children
        var childrenToAdd = [];
        $.each(relationsDataRaw.collection,
            (index, child) => {
                var childId = this.graph.computeNodeId(child);
                this.graph.manifestOrRegisterImplicitRelation(this.conceptNode.nodeId, childId, this.graph.relationLabelConstants.inheritance);
                if(this.graph.nodeMayBeExpanded(childId, this.conceptNode.nodeId, PathOptionConstants.termNeighborhoodConstant, this.expansionSet)){
                    childrenToAdd.push(child);
                    return;
                }
            }
        );
        
        // Wrap what we want to do, so that it can be controlled by the node-cap dialog system.
        // We can indeed allow these to be asyncrhonously returned to, while still executing the
        // paging fetch seen after this loop
        var groupedFetchCall = (maxToAdd: number): number=>{
            var numAdded = 0;
            $.each(childrenToAdd,
                (index, child) => {
                    if(null != maxToAdd && numAdded >= maxToAdd){
                        return false;
                    }
                    numAdded++;
                    
                    var childId = this.graph.computeNodeId(child);
                    // Was parsed in ConceptRelationshipJsonParser near line 75 (parseNewChildren)
                    // We have a complication though...paged results! Oh great...
                    // That alone is reason to fire these events separately anyway, but we can keep all the parsing stuck in this same
                    // place and fire off an additional REST call.
                    this.graph.expandAndParseNodeIfNeeded(childId, this.conceptNode.nodeId, child, PathOptionConstants.termNeighborhoodConstant, this.expansionSet, this.conceptNode.name);
                    this.graph.manifestOrRegisterImplicitRelation(this.conceptNode.nodeId, childId, this.graph.relationLabelConstants.inheritance);
                }
            );
            return numAdded;
        };
            
        // As we loop through children, the dialog will likely increment the count while the user looks at it.
        // if the user stops the expansion via this dialog, the expansion set is told that it was halted,
        // and it should not harass the user with the same question for this expansion.
        this.graph.checkForNodeCap(groupedFetchCall, this.expansionSet, childrenToAdd.length);
        
        // Children paging...only if children called directly?
         var pageNumber = relationsDataRaw["page"];
         var maxPageNumber = relationsDataRaw["pageCount"];
         if(maxPageNumber > pageNumber){
             this.graph.fetchChildren(this.conceptNode, this.url, pageNumber+1, this.directCallForExpansionType, this.expansionSet);
         }
    }
}


class ConceptParentsRelationsCallback extends Fetcher.CallbackObject {
    
    constructor(
        public graph: ConceptGraph,
        url: string,
        public conceptNode: Node,
        public conceptIdNodeMap: ConceptIdMap,
        public directCallForExpansionType: PathOption,
        public expansionSet: ExpansionSets.ExpansionSet<Node>
        ){
            super(url, String(conceptNode.nodeId), Fetcher.CallbackVarieties.nodesMultiple); //+":"+directCallForExpansionType);
        }
        
    public callback = (relationsDataRaw: any, textStatus: string, jqXHR: any) => {
        // textStatus and jqXHR will be undefined, because JSONP and cross domain GET don't use XHR.
        // CORS enabled GET and POST do though!
        if(jqXHR != null){
            if(relationsDataRaw.errors != null){
                // We had an error. Handle it.
                // No relations available? Why not? I'm not sure how to recover.
                return;
            }
        }
        
        var parentsToAdd = [];
        $.each(relationsDataRaw,
            (index, parent) => {
                var parentId = this.graph.computeNodeId(parent);
                this.graph.manifestOrRegisterImplicitRelation(parentId, this.conceptNode.nodeId, this.graph.relationLabelConstants.inheritance);
                if(this.graph.nodeMayBeExpanded(parentId, this.conceptNode.nodeId, PathOptionConstants.termNeighborhoodConstant, this.expansionSet)){
                    parentsToAdd.push(parent);
                    return;
                }
            }
        );
        
        // Wrap what we want to do, so that it can be controlled by the node-cap dialog system.
        // We can indeed allow these to be asynchronously returned to, while still executing the
        // paging fetch seen after this loop
        var groupedFetchCall = (maxToAdd: number): number=>{
            var numAdded = 0;
            $.each(parentsToAdd,
                (index, parent) => {
                    if(null != maxToAdd && numAdded >= maxToAdd){
                        return false;
                    }
                    numAdded++;
                    
                    var parentId = this.graph.computeNodeId(parent);
                    // Save the data in case we expand to include this node
                    this.graph.expandAndParseNodeIfNeeded(parentId, this.conceptNode.nodeId, parent, PathOptionConstants.termNeighborhoodConstant, this.expansionSet, this.conceptNode.name);
                    this.graph.manifestOrRegisterImplicitRelation(parentId, this.conceptNode.nodeId, this.graph.relationLabelConstants.inheritance);
                }
            );
            return numAdded;
        };
                    
        this.graph.checkForNodeCap(groupedFetchCall, this.expansionSet, parentsToAdd.length);

    }
}
        
class ConceptMappingsRelationsCallback extends Fetcher.CallbackObject {
    
    constructor(
        public graph: ConceptGraph,
        url: string,
        public conceptNode: Node,
        public conceptNodeIdMap: ConceptIdMap,
        public directCallForExpansionType: PathOption,
        public expansionSet: ExpansionSets.ExpansionSet<Node>
        ){
            super(url, String(conceptNode.nodeId), Fetcher.CallbackVarieties.links); //+":"+directCallForExpansionType);
        }
    
    public callback = (relationsDataRaw: any, textStatus: string, jqXHR: any) => {
        // textStatus and jqXHR will be undefined, because JSONP and cross domain GET don't use XHR.
        // CORS enabled GET and POST do though!
        if(jqXHR != null){
            if(relationsDataRaw.errors != null){
                // We had an error. Handle it.
                // No relations available? Why not? I'm not sure how to recover.
                return;
            }
        }
        
        // We have to collect the mappings to prevent some infinite loops. They can appear multiple times.
        var mappingTargetIds = {};
        var mappingTargets = {};
        var expectedExpansionCount = 0;
        $.each(relationsDataRaw,
                (index, mapping)=>{
            var firstConceptId = this.graph.computeNodeId(mapping.classes[0]);
            var secondConceptId = this.graph.computeNodeId(mapping.classes[1]);
            var newConceptId: ConceptURI;
            
            // Check the ids, grab the one opposite the sourcing concept
            var newConceptData = undefined;
            if(this.conceptNode.nodeId === firstConceptId){
                newConceptData = mapping.classes[1];
                newConceptId = secondConceptId;
            }
            if(this.conceptNode.nodeId === secondConceptId){
                newConceptData = mapping.classes[0];
                newConceptId = firstConceptId;
            }
                    
            if(newConceptId === this.conceptNode.nodeId){
                // This data error is not very helpful to see...
                // console.log("Error: mapping occurred without source as at both endpoints: "+firstConceptId+" and "+secondConceptId+" for call to "+this.url);   
            } else if(newConceptId === undefined || String(newConceptId) === "" || newConceptId === null){
                console.log("Error: mapping occurred without source as an endpoint: "+firstConceptId+" and "+secondConceptId+" for source "+this.conceptNode.nodeId+" for call to "+this.url);   
            }  else {
                // Sort endpoints to make mapping edges singular. Otherwise we get an edge going each way.
            	var firstId = newConceptId > this.conceptNode.nodeId ? newConceptId : this.conceptNode.nodeId ;
            	var secondId = newConceptId > this.conceptNode.nodeId ? this.conceptNode.nodeId : newConceptId ;
            	this.graph.manifestOrRegisterImplicitRelation(firstId, secondId, this.graph.relationLabelConstants.mapping);
            	
                // Catches self referential maps,
                var newNodeRawUri = this.graph.computeNodeId(newConceptData);
                var edge: Link = this.graph.expMan.edgeRegistry.getEdgesFor(firstId, secondId).filter((e: Link)=>{ return e.relationType ===  this.graph.relationLabelConstants.mapping; })[0];
                if(null == mappingTargetIds[String(newConceptId)]){
                    if(
                    this.graph.nodeMayBeExpanded(newNodeRawUri, this.conceptNode.nodeId, PathOptionConstants.mappingsNeighborhoodConstant, this.expansionSet)
                    ||
                    (
                        this.directCallForExpansionType === PathOptionConstants.mappingsNeighborhoodConstant
                        && edge !=  null
                        && this.graph.isEdgeForTemporaryRenderOnly(edge)
                    )
                        ){
                        mappingTargetIds[String(newConceptId)] = true;
                        mappingTargets[String(newConceptId)] = newConceptData;
                        expectedExpansionCount++;
                    }
                }
            }
        });
        
        var fetchCall = (maxToAdd: number): number=>{
            var added = 0;
            $.each(mappingTargets,
                (newConceptId: ConceptURI) => {
                    var newConceptData = mappingTargets[String(newConceptId)];
                    if(null != maxToAdd && added >= maxToAdd){
                        return false;
                    }
                      this.graph.expandMappedConcept(newConceptId, newConceptData, this.conceptNode.nodeId, this.directCallForExpansionType, this.expansionSet);
                      added++;
                }
            );
            
            // As a special case for when we expand mappings only to get temporary edges made permanent, we do this:
            this.graph.manifestEdgesForNewNode(this.conceptNode);
            return added;
        };

        this.graph.checkForNodeCap(fetchCall, this.expansionSet, expectedExpansionCount);
        
    }
}