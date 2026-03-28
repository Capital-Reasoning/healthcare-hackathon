import { cn } from '@/lib/utils';
import { LayoutCard, CardContent } from '@/components/layout/card';

interface ImageCardProps {
  src: string;
  alt: string;
  caption?: string;
  /** CSS aspect-ratio value (e.g., '16/9', '4/3', '1'). Default: '16/9' */
  aspectRatio?: string;
  className?: string;
}

function ImageCard({
  src,
  alt,
  caption,
  aspectRatio = '16/9',
  className,
}: ImageCardProps) {
  return (
    <LayoutCard data-slot="image-card" className={cn('overflow-hidden', className)}>
      <img
        src={src}
        alt={alt}
        className="w-full object-cover"
        style={{ aspectRatio }}
      />
      {caption && (
        <CardContent className="py-3">
          <p className="text-body-sm text-muted-foreground">{caption}</p>
        </CardContent>
      )}
    </LayoutCard>
  );
}

export { ImageCard, type ImageCardProps };
