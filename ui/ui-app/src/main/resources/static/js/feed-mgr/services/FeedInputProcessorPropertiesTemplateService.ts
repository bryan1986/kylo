/*-
 * #%L
 * thinkbig-ui-feed-manager
 * %%
 * Copyright (C) 2017 ThinkBig Analytics
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
/**
 * Return a custom Property input template for a given Processor
 */
import * as _ from "underscore";
import { Templates } from "./TemplateTypes";
import { UiComponentsService } from "./UiComponentsService";
import { Injectable } from "@angular/core";

@Injectable()
export class FeedInputProcessorPropertiesTemplateService {

    constructor(private uiComponentsService: UiComponentsService) {

    }
    setFeedProcessingTemplateUrl(processor: Templates.Processor, mode: string) {

        this.uiComponentsService.getProcessorTemplates().then((templates: any) => {

            var matchingTemplate = _.find(templates, (processorTemplate: any) => {
                return _.find(processorTemplate.processorTypes, function (type) {
                    if (processorTemplate.processorDisplayName != null && processorTemplate.processorDisplayName != undefined && processorTemplate.processorDisplayName != "") {
                        return processor.type == type && processor.name == processorTemplate.processorDisplayName;
                    }
                    else {
                        return processor.type == type;
                    }
                }) != null;
            });
            if (matchingTemplate != null) {
                if (mode == 'create') {
                    processor.feedPropertiesUrl = matchingTemplate.stepperTemplateUrl;
                }
                else {
                    processor.feedPropertiesUrl = matchingTemplate.feedDetailsTemplateUrl;
                }
            }

        });
    }
}

