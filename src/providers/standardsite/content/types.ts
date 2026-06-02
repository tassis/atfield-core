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

export type ListItemBlock =
	| {
			type: 'heading';
			level: number;
			text: string;
			richText?: RichText;
	  }
	| {
			type: 'paragraph';
			text: string;
			richText?: RichText;
	  }
	| {
			type: 'blockquote';
			text: string;
	  }
	| {
			type: 'callout';
			text: string;
			richText?: RichText;
			emoji?: string;
	  }
	| {
			type: 'image';
			layout: 'single' | 'grid' | 'carousel' | 'diff';
			images: Image[];
	  }
	| {
			type: 'embed';
			embedType: 'link' | 'gallery' | 'bluesky-post' | 'button';
			url?: string;
			title?: string;
			text?: string;
	  }
	| {
			type: 'code';
			code: string;
			language?: string;
	  }
	| {
			type: 'math';
			tex: string;
	  }
	| {
			type: 'divider';
	  }
	| {
			type: 'table';
			rows: TableRow[];
	  }
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

export type Block =
	| ListItemBlock
	| {
			type: 'list';
			style: 'bullet' | 'ordered' | 'task';
			items: ListItem[];
	  };

export type Options = {
	fallbackText?: string;
	onWarning?: (warning: Warning) => void;
};

export type Result = {
	vendor?: string;
	contentType?: string;
	blocks: Block[];
	warnings: Warning[];
	fallbackText?: string;
	skipped?: Skipped[];
};

export type ItemNormalizeContext = {
	path: string;
	warn: (warning: Warning) => void;
};

export type ItemNormalizer = (
	input: Record<string, unknown>,
	context: ItemNormalizeContext
) => Block;

export type ItemNormalizers = Record<string, ItemNormalizer>;

export type ExtractedBlock = {
	input: unknown;
	path: string;
};

export type Vendor = {
	name: string;
	extractBlocks: (
		content: Record<string, unknown>,
		warn: (warning: Warning) => void
	) => {
		blocks: ExtractedBlock[];
		skipped?: Skipped[];
	};
	normalizers: ItemNormalizers;
};
