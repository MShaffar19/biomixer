///<reference path="headers/require.d.ts" />
define(["require", "exports", "./BreadcrumbTrail", "./BackForwardBreadcrumbButtons", "UndoRedo/BreadcrumbTrail", "UndoRedo/BackForwardBreadcrumbButtons"], function(require, exports, BreadcrumbTrail, BackForwardBreadcrumbButtons) {
    /**
    * An undo model with a breadcrumb view composited into it.
    */
    var UndoRedoManager = (function () {
        function UndoRedoManager(initGui, useBackForwardButtons) {
            this.trail = new Array();
            this.currentTrailIndex = -1;
            if (useBackForwardButtons) {
                this.crumblez = new BackForwardBreadcrumbButtons.BackForwardBreadcrumbButtons();
            } else {
                this.crumblez = new BreadcrumbTrail.BreadcrumbTrail();
            }
            this.crumblez.undoRedoModel = this;

            if (initGui) {
                this.initGui();
            }
        }
        UndoRedoManager.prototype.initGui = function () {
            this.crumblez.initGui();
        };

        /**
        * When a new command is executed, add it here. This will truncate any undone command, and they
        * will no longer be available for redoing.
        *
        * NB There is no way to *only* remove commands without adding a new one. If there's a use case (limiting
        * memory use for example), go ahead and add that functionality.
        */
        UndoRedoManager.prototype.addCommand = function (newCommand) {
            // console.log("Adding to trail at: "+(this.currentTrailIndex + 1));
            // console.log("Remove from trail: "+(this.trail.length-1 - this.currentTrailIndex));
            // If we have 10 items, and the current item is 7 (index 0, so 8th item), then when we splice, we want to
            // insert at 8 (after 7, so at 7+1), and we want to remove from the array 2 items (index 8 and 9), which is
            // 10 - 1 - 7
            var removed = this.trail.splice(this.currentTrailIndex + 1, (this.trail.length - 1 - this.currentTrailIndex), newCommand);

            // console.log(this.trail[this.trail.length-1].getDisplayName());
            this.currentTrailIndex = this.trail.length - 1;

            // TODO Should we bother deleting the removed commands?
            // That is with the delete keyword?
            if (undefined !== this.crumblez) {
                // Get that command to store the current layout, before changing things.
                var active = this.crumblez.getActiveCrumb();
                if (undefined !== active) {
                    active.getCommand().snapshotLayout(true);
                }
                this.crumblez.updateView(this.trail, newCommand);
            }
        };

        /**
        * Useful for when the text of a crumb is not fixed at creation time.
        */
        UndoRedoManager.prototype.updateUI = function (existingCommand) {
            this.crumblez.updateElementText(existingCommand);
        };

        /**
        * Go back to another crumb. Really a convenience method, since
        * we will know whether it is a redo or undo internally.
        */
        UndoRedoManager.prototype.undoOneStep = function () {
            var index = Math.max(0, this.currentTrailIndex - 1);
            this.changeCurrentTrailPosition(this.trail[index]);
        };

        UndoRedoManager.prototype.redoOneStep = function () {
            var index = Math.min(this.currentTrailIndex + 1, this.trail.length - 1);
            this.changeCurrentTrailPosition(this.trail[index]);
        };

        UndoRedoManager.prototype.changeCurrentTrailPosition = function (command) {
            if (null == command) {
                // No change.
                return;
            }

            // Current active? Do nothing.
            var commandIndex = this.getCommandIndex(command);
            if (commandIndex === this.currentTrailIndex) {
                return;
            }

            var oldIndex = this.currentTrailIndex;
            this.currentTrailIndex = commandIndex;

            // No need to call the full refresh method, we haven't
            // changed the undo stack, just the active position.
            if (undefined !== this.crumblez) {
                this.crumblez.updateActiveCommand(command);
            }

            var increment;
            var undo;
            var stopAtIndex;
            var startAtIndex;
            if (commandIndex < oldIndex) {
                increment = -1;
                undo = true; //undoing
                startAtIndex = oldIndex; // From current downward, undo
                stopAtIndex = commandIndex; // DOn't undo our target
            } else {
                increment = +1;
                undo = false; //redoing
                startAtIndex = oldIndex + 1; // From next after current, redo
                stopAtIndex = commandIndex + 1; // Redo the target one, not past
            }
            for (var i = startAtIndex; i !== stopAtIndex; i += increment) {
                var anotherCommand = this.trail[i];
                if (undo) {
                    // In case the snapshot is at the head of the undo stack,
                    // temporarily save its layout in case we come back to it.
                    anotherCommand.snapshotLayout(false);
                    anotherCommand.executeUndo();
                } else {
                    anotherCommand.executeRedo();
                }
            }

            // Apply the layout we got a snapshot for in addCommand(), when the command was created.
            this.crumblez.getActiveCrumb().getCommand().applyLayout();
            // TODO Filters may need some refreshing, but the design separates the undo/redo in model from filters in view.
            // Fix if the inconsistency is a problem. Filters could be moved to be model oriented, but I have
            // them more as controller/views, due to the fact they only change the view. It might be tricky
            // to refactor to facilitate refreshing those on redo/undo!
            // When we do this, we also need to refresh filters. So, let's tell the graph model
            // that things have been undone, and it can carry out any additional cleanup as necessary.
            // this.graphView.afterUndoRedoPerformed();
        };

        UndoRedoManager.prototype.getCommandIndex = function (command) {
            return this.trail.indexOf(command);
        };

        /**
        * Although it trades modularity for encapsulation, I need to allow another class to access breadcrumb history to
        * inspect for whether a given node was expanded in our current state. Deletions and expansions
        * both weigh in on the decision.
        */
        UndoRedoManager.prototype.getCrumbHistory = function () {
            return this.trail.slice(0, this.currentTrailIndex + 1);
        };
        return UndoRedoManager;
    })();
    exports.UndoRedoManager = UndoRedoManager;

    

    
});