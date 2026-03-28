import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { ImageCard } from '@/components/data-display/image-card';

export const ImageCardDefinition = defineComponent({
  name: 'ImageCard',
  description:
    'Card displaying an image with optional caption. Supports configurable aspect ratio.',
  props: z.object({
    src: z.string().describe('Image URL'),
    alt: z.string().describe('Alt text for accessibility'),
    caption: z.string().optional().describe('Caption text displayed below the image'),
    aspectRatio: z
      .string()
      .optional()
      .describe('CSS aspect-ratio value (e.g. "16/9", "4/3", "1"). Default: "16/9"'),
  }),
  component: ({ props }) => ImageCard(props),
});
