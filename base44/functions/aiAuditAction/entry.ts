// ============================================================================
// aiAuditAction · Acciones del auditor sobre AILog (v3)
// ----------------------------------------------------------------------------
// Permite al admin auditar respuestas de IA con un solo clic:
//   action="approve"          → marca aprobada
//   action="flag"             → marca para revisión humana
//   action="retrain"          → marca para fine-tuning + opcional respuesta corregida
//   action="reject_retrain"   → descarta marca de retraining
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { logId, action, corrected_response, notes } = await req.json();

    if (!logId || !action) {
      return Response.json({ error: 'logId y action requeridos' }, { status: 400 });
    }

    const updates = {};
    switch (action) {
      case 'approve':
        updates.auditor_review = 'approved';
        updates.marked_for_retraining = false;
        if (notes) updates.auditor_notes = notes;
        break;
      case 'flag':
        updates.auditor_review = 'flagged';
        if (notes) updates.auditor_notes = notes;
        break;
      case 'retrain':
        updates.auditor_review = 'needs_retraining';
        updates.marked_for_retraining = true;
        updates.retraining_status = 'queued';
        if (corrected_response) updates.retraining_corrected_response = corrected_response;
        if (notes) updates.auditor_notes = notes;
        break;
      case 'reject_retrain':
        updates.marked_for_retraining = false;
        updates.retraining_status = 'rejected';
        if (notes) updates.auditor_notes = notes;
        break;
      case 'apply_retrain':
        updates.retraining_status = 'applied';
        break;
      default:
        return Response.json({ error: 'action inválida' }, { status: 400 });
    }

    await base44.asServiceRole.entities.AILog.update(logId, updates);
    return Response.json({ ok: true, logId, updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});