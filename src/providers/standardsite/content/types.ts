export type Warning = {
	code:
		| 'invalid_content'
		| 'invalid_items'
		| 'invalid_block'
		| 'unsupported_block'
		| 'unsupported_content';
	message: string;
	path?: string;
	rawType?: string;
};

export type StandardSiteContentVendor = 'offprint' | 'pckt' | 'leaflet';

export type Skipped = {
	kind: string;
	vendor?: string;
	reason: string;
	rawType?: string;
	path: string;
	raw: unknown;
};

export type RichTextMark = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'highlight';

export type RichTextSpan = {
	byteStart: number;
	byteEnd: number;
	marks?: RichTextMark[];
	link?: string;
	mention?: {
		did?: string;
		handle?: string;
		atUri?: string;
	};
};

export type RichText = {
	text: string;
	spans?: RichTextSpan[];
};

export type Image = {
	cid?: string;
	src?: string;
	mimeType?: string;
	width?: number;
	height?: number;
	alt?: string;
	title?: string;
	align?: 'left' | 'center' | 'right';
};

export type TableCell = {
	text: string;
	header?: boolean;
	colspan?: number;
	rowspan?: number;
};

export type TableRow = {
	cells: TableCell[];
};

type NormalizedBlockMetadata = {
	rawType?: string;
};

export type ListItemBlock =
	| (NormalizedBlockMetadata & {
			type: 'heading';
			level: number;
			text: string;
			richText?: RichText;
	  })
	| (NormalizedBlockMetadata & {
			type: 'paragraph';
			text: string;
			richText?: RichText;
	  })
	| (NormalizedBlockMetadata & {
			type: 'blockquote';
			text: string;
			richText?: RichText;
	  })
	| (NormalizedBlockMetadata & {
			type: 'callout';
			text: string;
			richText?: RichText;
			emoji?: string;
	  })
	| (NormalizedBlockMetadata & {
			type: 'image';
			layout: 'single' | 'grid' | 'carousel' | 'diff';
			images: Image[];
	  })
	| (NormalizedBlockMetadata & {
			type: 'embed';
			embedType: 'link' | 'gallery' | 'bluesky-post' | 'button';
			url?: string;
			title?: string;
			text?: string;
	  })
	| (NormalizedBlockMetadata & {
			type: 'code';
			code: string;
			language?: string;
	  })
	| (NormalizedBlockMetadata & {
			type: 'math';
			tex: string;
	  })
	| (NormalizedBlockMetadata & {
			type: 'divider';
	  })
	| (NormalizedBlockMetadata & {
			type: 'table';
			rows: TableRow[];
	  })
	| {
			type: 'unsupported';
			rawType: string;
			vendor?: string;
			raw: unknown;
	  }
	| {
			type: 'unknown';
			rawType?: string;
			raw: unknown;
	  };

export type ListItem = {
	text: string;
	blocks?: ListItemBlock[];
	richText?: RichText;
	checked?: boolean;
	children?: ListItem[];
};

export type NormalizedBlock =
	| ListItemBlock
	| (NormalizedBlockMetadata & {
			type: 'list';
			style: 'bullet' | 'ordered' | 'task';
			items: ListItem[];
	  });

export type Options = {
	fallbackText?: string;
	onWarning?: (warning: Warning) => void;
};

export type NormalizedResult = {
	vendor?: StandardSiteContentVendor;
	contentType?: string;
	blocks: NormalizedBlock[];
	warnings: Warning[];
	fallbackText?: string;
	skipped?: Skipped[];
};

export type SemanticType =
	| 'heading'
	| 'paragraph'
	| 'blockquote'
	| 'list'
	| 'code'
	| 'math'
	| 'divider'
	| 'image'
	| 'iframe-like'
	| 'button-like'
	| 'rich-link-like'
	| 'bluesky-post-like'
	| 'gallery-like';

export type HeadingSemanticValue = {
	level: number;
	text: string;
	richText?: RichText;
};

export type ParagraphSemanticValue = {
	text: string;
	richText?: RichText;
};

export type ImageSemanticValue = {
	image: Image;
	placeholder?: string;
};

export type RichLinkLikeSemanticValue = {
	url?: string;
	title?: string;
	description?: string;
	siteName?: string;
	previewImage?: Image;
};

export type IframeLikeSemanticValue = {
	url?: string;
	title?: string;
	description?: string;
	aspectRatio?: string;
};

export type BlockquoteSemanticValue = {
	text: string;
	richText?: RichText;
};

export type ListSemanticValue = {
	style: 'bullet' | 'ordered' | 'task';
	start?: number;
	items: ListItem[];
};

export type CodeSemanticValue = {
	code: string;
	language?: string;
};

export type MathSemanticValue = {
	tex: string;
};

export type DividerSemanticValue = Record<string, never>;

export type ButtonLikeSemanticValue = {
	url?: string;
	text?: string;
	align?: 'left' | 'center' | 'right';
};

export type BlueskyPostLikeSemanticValue = {
	uri?: string;
	cid?: string;
	clientHost?: string;
};

export type GalleryLikeSemanticValue = {
	items?: Image[];
	ref?: string;
	layout?: 'grid' | 'carousel' | 'gallery';
};

export type ContentBlock = {
	rawType: string;
	// Raw block payload after extraction, without its $type field.
	source: unknown;
	path?: string;
	semantic?: {
		type: SemanticType;
		value: unknown;
	};
};

export type ContentResult = {
	contentType?: string;
	blocks: ContentBlock[];
	warnings: Warning[];
	fallbackText?: string;
	skipped?: Skipped[];
};

export type ContentNormalizer = (input: unknown, options?: Options) => ContentResult;

export type BlockNormalizeContext = {
	path: string;
	warn: (warning: Warning) => void;
};

export type BlockNormalizer = (
	input: Record<string, unknown>,
	context: BlockNormalizeContext
) => NormalizedBlock;

export type BlockNormalizerRegistry = Record<string, BlockNormalizer>;

export type ContentBlockSemanticHandler = (
	input: Record<string, unknown>,
	context: BlockNormalizeContext & {
		rawType: string;
	}
) => ContentBlock['semantic'] | undefined;

export type ContentBlockSemanticHandlerRegistry = Record<string, ContentBlockSemanticHandler>;

export type ContentTypeDefinition = {
	vendor: StandardSiteContentVendor;
	extractBlocks: (
		content: Record<string, unknown>,
		warn: (warning: Warning) => void
	) => {
		blocks: Array<{
			input: unknown;
			path: string;
		}>;
		skipped?: Skipped[];
	};
};

export type ContentTypeRegistry = Record<string, ContentTypeDefinition>;

export type ContentBundle = {
	contentTypes?: ContentTypeRegistry;
	semanticHandlers?: ContentBlockSemanticHandlerRegistry;
};

export type ContentNormalizerConfig = {
	bundles?: ContentBundle[];
	contentTypes?: ContentTypeRegistry;
	semanticHandlers?: ContentBlockSemanticHandlerRegistry;
};
