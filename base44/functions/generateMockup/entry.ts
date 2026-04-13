import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { productName, productCategory, logoUrl, text, color, sku, jobId } = await req.json();

    if (!productName) {
      return Response.json({ error: 'productName es requerido' }, { status: 400 });
    }

    // Build a detailed prompt for the mockup
    let prompt = `Professional corporate gift product mockup photograph for Peyu Chile sustainable brand. `;
    prompt += `Product: "${productName}"`;
    if (productCategory) prompt += ` (category: ${productCategory})`;
    prompt += `. Made from 100% recycled plastic, manufactured in Chile. `;
    prompt += `Clean studio photography, soft white/neutral background, professional soft lighting. `;
    prompt += `High quality product shot showing the unique marbled texture of recycled plastic material. `;

    if (text && text.trim()) {
      prompt += `Laser UV engraved text "${text}" clearly visible on the product surface. Corporate branding. `;
    }

    if (logoUrl) {
      prompt += `Corporate logo applied to product via UV laser engraving. Professional corporate gift presentation. Office desk setting. `;
    }

    if (color) {
      prompt += `Product color: ${color}. `;
    }

    prompt += `Sustainable eco-design aesthetic, premium quality, Chilean manufacturing. `;
    prompt += `Shot angle: 3/4 view showing product details. Clean, minimal background.`;

    const result = await base44.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: logoUrl ? [logoUrl] : undefined,
    });

    // If jobId provided, update the PersonalizationJob
    if (jobId) {
      const job = await base44.asServiceRole.entities.PersonalizationJob.filter({ id: jobId });
      if (job && job.length > 0) {
        const currentUrls = job[0].mockup_urls || [];
        await base44.asServiceRole.entities.PersonalizationJob.update(jobId, {
          mockup_urls: [...currentUrls, result.url],
          status: 'Preview generado',
        });
      }
    }

    return Response.json({
      mockup_url: result.url,
      success: true,
      product: productName,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});