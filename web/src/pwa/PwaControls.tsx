import { usePwa } from './usePwa';
import './pwa.css';

export type PwaControlsProps = { hasUnsavedChanges: boolean };

export function PwaControls({ hasUnsavedChanges }: PwaControlsProps) {
  const pwa = usePwa(hasUnsavedChanges);
  return (
    <aside class="pwa-controls" aria-label="Pemasangan dan pembaruan RuangJiwa">
      <p class="pwa-controls__status" role="status" aria-live="polite">
        {pwa.installed ? 'RuangJiwa dibuka sebagai aplikasi.' : 'RuangJiwa dapat digunakan di browser.'}
        {pwa.offlineReady && ' Tampilan aplikasi tersedia offline. Masuk akun dan sinkronisasi tetap memerlukan internet.'}
      </p>
      {!pwa.installed && pwa.ios ? (
        <p>Untuk memasang di iPhone atau iPad, buka halaman ini di Safari, pilih Bagikan, lalu Tambahkan ke Layar Utama. Jika pilihan itu tidak terlihat, periksa menu browser. Tidak ada tombol pemasangan otomatis di sini.</p>
      ) : !pwa.installed && pwa.canInstall ? (
        <button type="button" disabled={Boolean(pwa.busy)} onClick={() => void pwa.install()}>
          {pwa.busy === 'install' ? 'Membuka pemasangan...' : 'Pasang RuangJiwa'}
        </button>
      ) : !pwa.installed ? (
        <p>Jika menu browser menyediakan opsi pemasangan atau Tambahkan ke Layar Utama, gunakan opsi tersebut.</p>
      ) : null}
      {pwa.waiting && (
        <div class="pwa-controls__update">
          <p role="status" aria-live="polite"><strong>Pembaruan tersedia.</strong> Simpan jurnal di semua tab sebelum memuat ulang. Aplikasi tidak akan memuat ulang sendiri.</p>
          {hasUnsavedChanges && <p id="pwa-unsaved">Masih ada perubahan yang belum disimpan. Simpan atau batalkan perubahan terlebih dahulu.</p>}
          <button
            type="button"
            disabled={hasUnsavedChanges || Boolean(pwa.busy)}
            aria-describedby={hasUnsavedChanges ? 'pwa-unsaved' : undefined}
            onClick={() => pwa.update(hasUnsavedChanges)}
          >
            {pwa.busy === 'update' ? 'Menyiapkan pembaruan...' : 'Perbarui dan muat ulang'}
          </button>
          <p class="pwa-controls__note">Boleh lanjut menulis. Pembaruan ini bisa menunggu.</p>
        </div>
      )}
      {pwa.error && (
        <div role="alert">
          <p>{pwa.error}</p>
          <button type="button" disabled={Boolean(pwa.busy)} onClick={pwa.retry}>Periksa lagi</button>
        </div>
      )}
    </aside>
  );
}
