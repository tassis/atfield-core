import { offprintContentTypeDefinition, offprintSemanticHandlers } from './vendors/offprint';
import { pcktContentTypeDefinition, pcktSemanticHandlers } from './vendors/pckt';
import { leafletContentTypeDefinition, leafletSemanticHandlers } from './vendors/leaflet';
import type {
	ContentBlockSemanticHandlerRegistry,
	ContentBundle,
	ContentTypeRegistry
} from './types';

const contentTypesByType: ContentTypeRegistry = {
	'app.offprint.content': offprintContentTypeDefinition,
	'blog.pckt.content': pcktContentTypeDefinition,
	'pub.leaflet.content': leafletContentTypeDefinition
};

const semanticHandlersByType: ContentBlockSemanticHandlerRegistry = {
	...offprintSemanticHandlers,
	...pcktSemanticHandlers,
	...leafletSemanticHandlers
};

export const offprintBundle: ContentBundle = {
	contentTypes: {
		'app.offprint.content': offprintContentTypeDefinition
	},
	semanticHandlers: offprintSemanticHandlers
};

export const pcktBundle: ContentBundle = {
	contentTypes: {
		'blog.pckt.content': pcktContentTypeDefinition
	},
	semanticHandlers: pcktSemanticHandlers
};

export const leafletBundle: ContentBundle = {
	contentTypes: {
		'pub.leaflet.content': leafletContentTypeDefinition
	},
	semanticHandlers: leafletSemanticHandlers
};

export const defaultContentBundle: ContentBundle = {
	contentTypes: contentTypesByType,
	semanticHandlers: semanticHandlersByType
};
