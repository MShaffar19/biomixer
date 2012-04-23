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
package org.thechiselgroup.biomixer.client.services.ontology;

import static org.hamcrest.CoreMatchers.equalTo;
import static org.junit.Assert.assertThat;

import java.io.IOException;

import org.junit.Before;
import org.junit.Test;
import org.thechiselgroup.biomixer.client.services.AbstractJsonParserTest;
import org.thechiselgroup.biomixer.server.workbench.util.json.JavaJsonParser;

public class OntologyVersionJsonParserTest extends AbstractJsonParserTest {

    private OntologyVersionJsonParser underTest;

    public OntologyVersionJsonParserTest() {
        super(OntologyVersionJsonParserTest.class);
    }

    @Test
    public void getOntologyVersionIdForVirtualId1148() throws IOException {
        String ontologyVersionId = parseOntologyVersionId("virtual_ontology_id_1148.json");
        assertThat(ontologyVersionId, equalTo("42948"));
    }

    @Test
    public void getOntologyVersionIdForVirtualId1487() throws IOException {
        String ontologyVersionId = parseOntologyVersionId("virtual_ontology_id_1487.json");
        assertThat(ontologyVersionId, equalTo("42651"));
    }

    private String parseOntologyVersionId(String jsonFilename)
            throws IOException {
        return underTest.parse(getFileContentsAsString(jsonFilename));
    }

    @Before
    public void setUp() {
        underTest = new OntologyVersionJsonParser(new JavaJsonParser());
    }

}
