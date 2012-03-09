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
package org.thechiselgroup.biomixer.client;

import org.thechiselgroup.biomixer.client.core.error_handling.ErrorHandlingAsyncCallback;
import org.thechiselgroup.biomixer.client.core.resources.DefaultResourceSet;
import org.thechiselgroup.biomixer.client.core.resources.Resource;
import org.thechiselgroup.biomixer.client.core.resources.ResourceSet;
import org.thechiselgroup.biomixer.client.core.visualization.ViewIsReadyCondition;
import org.thechiselgroup.biomixer.client.services.mapping.MappingServiceAsync;
import org.thechiselgroup.biomixer.client.services.term.TermServiceAsync;
import org.thechiselgroup.biomixer.client.visualization_component.graph.ResourceNeighbourhood;
import org.thechiselgroup.biomixer.client.visualization_component.graph.layout.implementation.circle.CircleLayoutAlgorithm;

import com.google.inject.Inject;

public class MappingNeighbourhoodLoader extends AbstractEmbedLoader {

    public static final String EMBED_MODE = "mapping_neighbourhood";

    @Inject
    private TermServiceAsync termService;

    @Inject
    private MappingServiceAsync mappingService;

    private void doLoadData() {
        termService.getBasicInformation(virtualOntologyId, fullConceptId,
                new ErrorHandlingAsyncCallback<Resource>(errorHandler) {
                    @Override
                    protected void runOnSuccess(final Resource targetResource)
                            throws Exception {
                        final ResourceSet resourceSet = new DefaultResourceSet();
                        resourceSet.add(targetResource);

                        // TODO move to MappedConceptsServiceAsyncImpl
                        mappingService
                                .getMappings(
                                        virtualOntologyId,
                                        fullConceptId,
                                        new ErrorHandlingAsyncCallback<ResourceNeighbourhood>(
                                                errorHandler) {

                                            @Override
                                            protected void runOnSuccess(
                                                    ResourceNeighbourhood mappingNeighbourhood)
                                                    throws Exception {

                                                targetResource
                                                        .applyPartialProperties(mappingNeighbourhood
                                                                .getPartialProperties());

                                                for (Resource mappingResource : mappingNeighbourhood
                                                        .getResources()) {
                                                    String sourceUri = Mapping
                                                            .getSource(mappingResource);
                                                    String targetUri = Mapping
                                                            .getTarget(mappingResource);

                                                    final String otherUri = targetResource
                                                            .getUri().equals(
                                                                    sourceUri) ? targetUri
                                                            : sourceUri;

                                                    final String otherOntologyId = Concept
                                                            .getOntologyId(otherUri);
                                                    final String otherConceptId = Concept
                                                            .getConceptId(otherUri);
                                                    termService
                                                            .getBasicInformation(
                                                                    otherOntologyId,
                                                                    otherConceptId,
                                                                    new ErrorHandlingAsyncCallback<Resource>(
                                                                            errorHandler) {
                                                                        @Override
                                                                        protected void runOnSuccess(
                                                                                Resource result)
                                                                                throws Exception {

                                                                            resourceSet
                                                                                    .add(result);
                                                                            graphView
                                                                                    .getResourceModel()
                                                                                    .addResourceSet(
                                                                                            resourceSet);
                                                                            layout(graphView);
                                                                        }

                                                                        @Override
                                                                        protected Throwable wrapException(
                                                                                Throwable caught) {
                                                                            return new Exception(
                                                                                    "Could not get basic information for "
                                                                                            + otherConceptId,
                                                                                    caught);
                                                                        }
                                                                    });

                                                }

                                            }

                                            @Override
                                            protected Throwable wrapException(
                                                    Throwable caught) {
                                                return new Exception(
                                                        "Could not expand mapping neighbourhood for "
                                                                + fullConceptId,
                                                        caught);
                                            }

                                        });
                    }

                    @Override
                    protected Throwable wrapException(Throwable caught) {
                        return new Exception(
                                "Could not retrieve basic information for "
                                        + fullConceptId, caught);
                    }
                });
    }

    @Override
    public String getEmbedMode() {
        return EMBED_MODE;
    }

    @Override
    protected void loadData() {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                doLoadData();
            }
        }, new ViewIsReadyCondition(graphView), 200);
    }

    @Override
    protected void setLayoutAlgorithm() {
        this.layoutAlgorithm = new CircleLayoutAlgorithm(errorHandler);
    }

}
