'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfile, type Verification } from '@/lib/profile';

const labelClass = 'font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-300 mb-2 block';
const inputClass = 'form-input w-full px-4 py-3 text-white font-sans text-sm';
const h2 = 'font-serif text-[24px] text-white tracking-tight mb-5';
const MAX_BYTES = 8 * 1024 * 1024;

const VERIFY: Record<Verification, { text: string; note: string; tone: string }> = {
  unverified: { text: 'Not verified', note: 'Upload a national ID or passport to build your trust score.', tone: 'text-emerald-100/60' },
  pending: { text: 'In review', note: 'Thanks. Our team is checking your document.', tone: 'text-amber-300' },
  verified: { text: 'Verified', note: 'Your identity is verified.', tone: 'text-emerald-400' },
  rejected: { text: 'Rejected', note: 'We couldn’t verify that document. Please upload a clearer photo.', tone: 'text-red-300' },
};

export default function ProfilePage() {
  const qc = useQueryClient();
  const profileQ = useProfile();
  const profile = profileQ.data;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [idMsg, setIdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaveMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim() || null, phone: phone.trim() || null })
      .eq('id', profile.id);
    setSaving(false);
    if (error) return setSaveMsg({ ok: false, text: error.message });
    setSaveMsg({ ok: true, text: 'Saved.' });
    qc.invalidateQueries({ queryKey: ['profile'] });
  };

  const uploadId = async () => {
    if (!profile || !file) return;
    setIdMsg(null);
    if (!/^(image\/|application\/pdf)/.test(file.type)) return setIdMsg({ ok: false, text: 'Please choose an image or a PDF.' });
    if (file.size > MAX_BYTES) return setIdMsg({ ok: false, text: 'That file is over 8 MB.' });

    setUploading(true);
    const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${profile.id}/${Date.now()}.${ext}`;

    const { error: upError } = await supabase.storage.from('id-documents').upload(path, file, { contentType: file.type });
    if (upError) {
      setUploading(false);
      return setIdMsg({ ok: false, text: upError.message });
    }
    const { error: profError } = await supabase.from('profiles').update({ verification: 'pending' }).eq('id', profile.id);
    setUploading(false);
    if (profError) return setIdMsg({ ok: false, text: profError.message });

    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setIdMsg({ ok: true, text: 'Uploaded. We’ll review it shortly.' });
    qc.invalidateQueries({ queryKey: ['profile'] });
  };

  if (profileQ.isLoading) return <div className="h-96 bg-emerald-900/20 animate-pulse rounded-sm" />;
  if (!profile) return <p className="font-sans text-emerald-50/70">We couldn’t load your profile.</p>;

  const v = VERIFY[profile.verification];
  const canUpload = profile.verification === 'unverified' || profile.verification === 'rejected';

  return (
    <div className="space-y-14 max-w-xl">
      <h1 className="font-serif text-[36px] md:text-[44px] text-white tracking-tighter leading-[1.1]">Profile</h1>

      <section>
        <h2 className={h2}>Your details</h2>
        <form onSubmit={saveDetails} className="space-y-6">
          <div>
            <label htmlFor="pf-name" className={labelClass}>Full name</label>
            <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Sarah Anderson" />
          </div>
          <div>
            <label htmlFor="pf-phone" className={labelClass}>Phone</label>
            <input id="pf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="0712 345 678" />
          </div>
          {saveMsg && (
            <p role="status" className={`font-sans text-sm ${saveMsg.ok ? 'text-emerald-400' : 'text-red-300'}`}>{saveMsg.text}</p>
          )}
          <button type="submit" disabled={saving}
            className="px-10 py-4 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] text-black font-medium bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      <section>
        <h2 className={h2}>ID verification</h2>
        <div className="glass-panel p-6">
          <p className={`font-mono text-[10px] uppercase tracking-[0.2em] mb-2 ${v.tone}`}>{v.text}</p>
          <p className="font-sans text-[14px] text-emerald-50/70 mb-6">{v.note}</p>

          {canUpload && (
            <div className="space-y-4">
              <label htmlFor="pf-id" className={labelClass}>National ID or passport (photo or PDF, max 8 MB)</label>
              <input
                id="pf-id"
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full font-sans text-sm text-emerald-50/80 file:mr-4 file:px-4 file:py-2.5 file:rounded-sm file:border file:border-emerald-300/30 file:bg-transparent file:text-emerald-200 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.15em] hover:file:bg-emerald-500/10"
              />
              {idMsg && (
                <p role="status" className={`font-sans text-sm ${idMsg.ok ? 'text-emerald-400' : 'text-red-300'}`}>{idMsg.text}</p>
              )}
              <button type="button" onClick={uploadId} disabled={!file || uploading}
                className="px-8 py-3.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] text-black font-medium bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {uploading ? 'Uploading…' : 'Upload for review'}
              </button>
            </div>
          )}
          {!canUpload && idMsg && (
            <p role="status" className={`font-sans text-sm ${idMsg.ok ? 'text-emerald-400' : 'text-red-300'}`}>{idMsg.text}</p>
          )}
        </div>
      </section>
    </div>
  );
}