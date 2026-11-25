import { useEffect, useState } from "preact/hooks";
import { Session } from "../core/session";
import { useSession } from "../core/hooks";
import { safePhotoUrl } from "../core/config";
import { profileValidation } from "../features/profile";
import { Field, useAction, ActionFeedback } from "../ui/shared";
export function ProfilePage({
  session,
  path: _path,
}: {
  session: Session;
  path?: string;
}) {
  const state = useSession(session),
    [name, setName] = useState(
      state.profile?.name ?? state.user?.displayName ?? "",
    ),
    [photo, setPhoto] = useState<File>(),
    [validation, setValidation] = useState(""),
    action = useAction();
  useEffect(() => {
    setName(state.profile?.name ?? state.user?.displayName ?? "");
  }, [state.profile?.name, state.user?.uid]);
  const url = safePhotoUrl(
    state.profile?.photoUrl ?? state.user?.photoURL ?? undefined,
  );
  return (
    <>
      <h1>Profil saya</h1>
      {!state.profile && (
        <p role="status">Memuat profil. Jika gagal, coba muat ulang.</p>
      )}
      {url && (
        <img
          src={url}
          alt="Foto profil saya"
          width="96"
          height="96"
          referrerPolicy="no-referrer"
        />
      )}
      <button
        disabled={action.busy}
        onClick={() => void session.refreshProfile()}
      >
        Muat ulang profil
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const message = profileValidation(name, photo);
          setValidation(message);
          if (message) return;
          void action.run(async () => {
            const saved = await session.saveProfile(name.trim(), photo);
            if (saved) setPhoto(undefined);
            return saved;
          }, "Profil tersimpan.");
        }}
      >
        <Field label="Nama profil">
          <input
            value={name}
            required
            maxLength={100}
            autoComplete="name"
            onInput={(e) => {
              setName(e.currentTarget.value);
              setValidation("");
            }}
          />
        </Field>
        <Field label="Email akun">
          <input type="email" readOnly value={state.user?.email ?? ""} />
        </Field>
        <p>
          Email berasal dari akun Auth. Perubahan email memerlukan autentikasi
          ulang dan verifikasi, tidak dilakukan di formulir ini.
        </p>
        <Field label="Foto profil (opsional)">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              setPhoto(e.currentTarget.files?.[0]);
              setValidation("");
            }}
          />
        </Field>
        <p>
          JPEG, PNG atau WebP, maksimal 5 MB. Foto diunggah ke Firebase Storage
          pengelola.
        </p>
        {validation && <p role="alert">{validation}</p>}
        <button class="primary" disabled={action.busy}>
          Simpan profil
        </button>
      </form>
      <ActionFeedback action={action} />
      <section>
        <h2>Pemulihan kata sandi</h2>
        <button
          disabled={!state.user?.email || action.busy}
          onClick={() =>
            void action.run(
              () => session.backend!.resetPassword(state.user!.email!),
              "Jika email dapat menerima pemulihan, periksa kotak masuk.",
            )
          }
        >
          Kirim pemulihan kata sandi
        </button>
      </section>
      <section>
        <h2>Privasi dan penggunaan</h2>
        <p>
          Catatan pribadi memerlukan koneksi internet dan tidak tersedia
          offline. Pada perangkat bersama, keluar setelah selesai. Aplikasi ini
          bukan layanan darurat atau pengganti tenaga kesehatan.
        </p>
        <p>
          Pengelola deployment bertanggung jawab atas kebijakan privasi, aturan
          akses Firebase dan penghapusan akun/data. Tidak ada kebijakan
          pengelola yang disediakan dalam sumber aplikasi ini.
        </p>
      </section>
    </>
  );
}
