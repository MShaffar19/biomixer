/*******************************************************************************
 * Copyright 2012 David Rusk 
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at 
 *
 *    http://www.apache.org/licenses/LICENSE-2.0 
 *     
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 * See the License for the specific language governing permissions and 
 * limitations under the License.  
 *******************************************************************************/
package org.thechiselgroup.biomixer.client.visualization_component.graph.layout.implementation.force_directed;

import java.util.List;

import org.thechiselgroup.biomixer.client.core.geometry.PointDouble;
import org.thechiselgroup.biomixer.client.visualization_component.graph.layout.LayoutNode;

/**
 * Methods that may be useful to multiple force calculator implementations.
 * 
 * @author drusk
 * 
 */
public abstract class AbstractForceCalculator implements ForceCalculator {

    protected double getAngleBetween(LayoutNode node1, LayoutNode node2) {
        return getDistanceVector(node1, node2).getDirection();
    }

    protected double getDistanceBetween(LayoutNode node1, LayoutNode node2) {
        return getDistanceVector(node1, node2).getMagnitude();
    }

    /**
     * Gets the distance vector between the centre points of the two specified
     * nodes.
     * 
     * @param source
     *            node at start of distance vector (vector points away from this
     *            node)
     * @param target
     *            node at end of distance vector (vector points towards this
     *            node)
     * @return distance vector
     */
    protected Vector2D getDistanceVector(LayoutNode source, LayoutNode target) {
        PointDouble sourceCentre = source.getCentre();
        PointDouble targetCentre = target.getCentre();
        return new Vector2D(targetCentre.getX() - sourceCentre.getX(),
                targetCentre.getY() - sourceCentre.getY());
    }

    @Override
    public Vector2D getNetForce(LayoutNode currentNode,
            List<LayoutNode> otherNodes) {
        Vector2D netForce = new Vector2D(0, 0);
        for (LayoutNode otherNode : otherNodes) {
            netForce.add(getForce(currentNode, otherNode));
        }
        return netForce;
    }

}
