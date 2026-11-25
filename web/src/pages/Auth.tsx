import { useState } from "preact/hooks";
import { Session } from "../core/session";
import { Field, useAction, ActionFeedback } from "../ui/shared";
export function Auth({ session }: { session: Session }) {
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const action = useAction();
  return (
    <section class="auth">
      <h1>{register ? "Buat akun RuangJiwa" : "Masuk ke RuangJiwa"}</h1>
      <p>Ruang untuk mencatat perasaan dan refleksi pribadi.</p>
      {!session.backend && (
        <aside>
          <h2>Konfigurasi Firebase diperlukan</h2>
          <p>
            Pengelola perlu mengisi konfigurasi VITE_FIREBASE di lingkungan
            deployment. Login dan penyimpanan belum tersedia. Tidak ada akun
            tamu atau data contoh.
          </p>
          <p>
            Kerangka aplikasi dapat dibuka offline. Catatan pribadi hanya
            diakses saat online.
          </p>
        </aside>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(() => session.login(email, password, register), "");
        }}
      >
        <Field label="Email">
          <input
            type="email"
            value={email}
            onInput={(e) => setEmail(e.currentTarget.value)}
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Kata sandi">
          <input
            type="password"
            value={password}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            minLength={register ? 6 : 1}
            autoComplete={register ? "new-password" : "current-password"}
          />
        </Field>
        {register && (
          <p>
            Kata sandi minimal 6 karakter. Catatan disimpan di proyek Firebase
            pengelola. Gunakan hanya setelah kebijakan privasi dan aturan akses
            proyek ditinjau.
          </p>
        )}
        <button class="primary" disabled={!session.backend || action.busy}>
          {register ? "Daftar" : "Masuk"}
        </button>
      </form>
      <ActionFeedback action={action} />
      <div class="actions">
        <button
          onClick={() => {
            setRegister(!register);
            action.clear();
          }}
        >
          {register ? "Kembali masuk" : "Buat akun"}
        </button>
        {session.backend && (
          <button
            disabled={action.busy || !email}
            onClick={() =>
              void action.run(
                () => session.backend!.resetPassword(email),
                "Jika email dapat menerima pemulihan, periksa kotak masuk.",
              )
            }
          >
            Kirim pemulihan kata sandi
          </button>
        )}
      </div>
    </section>
  );
}
