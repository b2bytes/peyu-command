import InstagramMockup from './InstagramMockup';
import LinkedInMockup from './LinkedInMockup';
import TikTokMockup from './TikTokMockup';
import FacebookMockup from './FacebookMockup';
import TwitterMockup from './TwitterMockup';
import PinterestMockup from './PinterestMockup';

/**
 * Router universal de mockups por red social.
 * Renderiza el preview nativo apropiado según post.red_social.
 */
export default function PostMockup({ post, scale = 'md' }) {
  if (!post) return null;
  const red = post.red_social;

  if (red === 'Instagram' || red === 'Threads' || red === 'YouTube') {
    return <InstagramMockup post={post} scale={scale} />;
  }
  if (red === 'LinkedIn') return <LinkedInMockup post={post} scale={scale} />;
  if (red === 'TikTok') return <TikTokMockup post={post} scale={scale} />;
  if (red === 'Facebook') return <FacebookMockup post={post} scale={scale} />;
  if (red === 'Twitter/X') return <TwitterMockup post={post} scale={scale} />;
  if (red === 'Pinterest') return <PinterestMockup post={post} scale={scale} />;

  // Fallback
  return <InstagramMockup post={post} scale={scale} />;
}