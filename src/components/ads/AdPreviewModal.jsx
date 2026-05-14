// ============================================================================
// AdPreviewModal — Muestra previews realistas de cómo se verá la campaña
// en Google Search, YouTube, Discover y Gmail (estilo Google Ads UI).
// ============================================================================
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Youtube, Newspaper, Mail } from 'lucide-react';
import SearchAdPreview from './previews/SearchAdPreview';
import YouTubeAdPreview from './previews/YouTubeAdPreview';
import DiscoverAdPreview from './previews/DiscoverAdPreview';
import GmailAdPreview from './previews/GmailAdPreview';

export default function AdPreviewModal({ open, onOpenChange, draft }) {
  // Determinamos qué tabs mostrar según el tipo de campaña
  const isSearch = ['Search', 'Performance Max'].includes(draft?.campaign_type);
  const isVisual = ['Performance Max', 'Demand Gen', 'Display'].includes(draft?.campaign_type);

  const defaultTab = isVisual ? 'youtube' : 'search';
  const [tab, setTab] = useState(defaultTab);

  if (!draft) return null;

  // Datos para Search Ad (primer RSA o primer ad group)
  const firstRSA = draft.responsive_search_ads?.[0];
  const searchHeadlines = firstRSA?.headlines || draft.asset_groups?.[0]?.headlines || [];
  const searchDescs = firstRSA?.descriptions || draft.asset_groups?.[0]?.descriptions || [];

  // Datos para visuales (primer asset group)
  const firstAG = draft.asset_groups?.[0];
  const visualHeadlines = firstAG?.headlines || searchHeadlines;
  const visualDescs = firstAG?.descriptions || searchDescs;
  const visualImage = firstAG?.image_urls?.[0] || '';
  const cta = firstAG?.call_to_action || 'Saber más';
  const businessName = firstAG?.business_name || 'PEYU Chile';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Preview · {draft.campaign_name}</span>
            <span className="text-[10px] font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
              Cómo se verá en Google
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="search" disabled={!isSearch} className="text-xs gap-1.5">
              <Search className="w-3.5 h-3.5" /> Search
            </TabsTrigger>
            <TabsTrigger value="youtube" disabled={!isVisual} className="text-xs gap-1.5">
              <Youtube className="w-3.5 h-3.5" /> YouTube
            </TabsTrigger>
            <TabsTrigger value="discover" disabled={!isVisual} className="text-xs gap-1.5">
              <Newspaper className="w-3.5 h-3.5" /> Discover
            </TabsTrigger>
            <TabsTrigger value="gmail" disabled={!isVisual} className="text-xs gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Gmail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4 flex justify-center bg-gray-50 rounded-xl p-6">
            <SearchAdPreview
              headlines={searchHeadlines}
              descriptions={searchDescs}
              landingUrl={firstRSA?.final_url || draft.landing_url}
              path1={firstRSA?.path1}
              path2={firstRSA?.path2}
              sitelinks={draft.sitelinks || []}
            />
          </TabsContent>

          <TabsContent value="youtube" className="mt-4 flex justify-center bg-gray-100 rounded-xl p-6">
            <YouTubeAdPreview
              businessName={businessName}
              headlines={visualHeadlines}
              descriptions={visualDescs}
              cta={cta}
              imageUrl={visualImage}
            />
          </TabsContent>

          <TabsContent value="discover" className="mt-4 flex justify-center bg-gray-100 rounded-xl p-6">
            <DiscoverAdPreview
              businessName={businessName}
              headlines={visualHeadlines}
              descriptions={visualDescs}
              cta={cta}
              imageUrl={visualImage}
            />
          </TabsContent>

          <TabsContent value="gmail" className="mt-4 flex justify-center bg-gray-50 rounded-xl p-6">
            <GmailAdPreview
              businessName={businessName}
              headlines={visualHeadlines}
              descriptions={visualDescs}
              imageUrl={visualImage}
            />
          </TabsContent>
        </Tabs>

        <p className="text-[10px] text-gray-400 text-center mt-2 italic">
          Estos previews son aproximaciones del look real de Google Ads. El render final puede variar según device, formato y rotación automática.
        </p>
      </DialogContent>
    </Dialog>
  );
}