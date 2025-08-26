import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const PRICING_API = process.env.REACT_APP_PRICING_API_BASE || "http://localhost:8000";
const UPLOAD_API = process.env.REACT_APP_UPLOAD_API_BASE || "http://localhost:5000";
const PRODUCT_SLUG = process.env.REACT_APP_PRODUCT_SLUG || "s3-image-uploader";

function App() {
  // uploader state
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  // pricing state
  const [plans, setPlans] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(true);

  // auth + subscription state
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Load auth session
  useEffect(() => {
    const s = supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, ses) => setSession(ses));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load pricing table
  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await fetch(`${PRICING_API}/public/pricing/${PRODUCT_SLUG}`);
        const data = await res.json();
        setPlans(data.plans || []);
      } catch (e) {
        console.error("Failed to load pricing", e);
      } finally {
        setLoadingPricing(false);
      }
    }
    loadPricing();
  }, []);

  // Load current subscription when logged in
  useEffect(() => {
    async function loadSub() {
      if (!session?.user) { setSubscription(null); return; }
      try {
        const uid = session.user.id;
        const res = await fetch(`${PRICING_API}/public/subscription/${PRODUCT_SLUG}?user_id=${uid}`);
        const data = await res.json();
        setSubscription(data.subscription || null);
      } catch (e) {
        console.error("Failed to load subscription", e);
      }
    }
    loadSub();
  }, [session]);

  // Auth actions
  const signUp = async () => {
    setMsg("");
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) setMsg(error.message);
    else setMsg("Check your email to confirm your account, then sign in.");
  };

  const signIn = async () => {
    setMsg("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setMsg(error.message);
    else setMsg("Signed in!");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMsg("Signed out.");
  };

  // Choose plan (subscribe)
  const choosePlan = async (plan) => {
    if (!session?.user) { setMsg("Please sign in first."); return; }
    setSubLoading(true);
    setMsg("");
    try {
      // We need product_id. You can hardcode or fetch the product by slug.
      // Easiest: call pricing endpoint (we already have plans only). We’ll ask backend to accept product_id via plan to keep this simple:
      // We don’t have product_id in the plans, so do a fetch to get product id quickly:
      const prodRes = await fetch(`${PRICING_API}/public/pricing/${PRODUCT_SLUG}`);
      const prodData = await prodRes.json();
      const productId = prodData?.product?.id;

      const payload = {
        user_id: session.user.id,
        product_id: productId,
        plan_id: plan.plan_id
      };

      const res = await fetch(`${PRICING_API}/public/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error("Failed to subscribe");

      setMsg(`Subscribed to ${plan.name}!`);
      // refresh subscription
      const subRes = await fetch(`${PRICING_API}/public/subscription/${PRODUCT_SLUG}?user_id=${session.user.id}`);
      const subData = await subRes.json();
      setSubscription(subData.subscription || null);
    } catch (e) {
      console.error(e);
      setMsg("Could not subscribe. Try again.");
    } finally {
      setSubLoading(false);
    }
  };

  // Uploader
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const canUpload = !!session?.user && !!subscription;

  const uploadFile = async () => {
    if (!image) return;
    if (!canUpload) { setMsg("Please sign in and choose a plan first."); return; }

    const formData = new FormData();
    formData.append("file", image);

    try {
      const response = await fetch(`${UPLOAD_API}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadedUrl(data.url);
      setMsg("Upload successful!");
    } catch (err) {
      console.error("Error uploading file:", err);
      setMsg("Upload failed.");
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h2>🖼️ S3 Image Uploader</h2>

      {/* Auth Box */}
      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3>Account</h3>
        {session?.user ? (
          <div>
            <p>Signed in as: <b>{session.user.email}</b></p>
            <button onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="email"
              placeholder="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />
            <button onClick={signIn}>Sign in</button>
            <button onClick={signUp}>Sign up</button>
          </div>
        )}
        {msg && <p style={{ color: "#333", marginTop: 8 }}>{msg}</p>}
      </div>

      {/* Upload UI (gated) */}
      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3>Upload</h3>
        {!session?.user && <p style={{ color: "#b00" }}>Please sign in to upload.</p>}
        {session?.user && !subscription && <p style={{ color: "#b00" }}>Choose a plan to enable uploads.</p>}

        <input type="file" onChange={handleFileInput} disabled={!canUpload} />
        {preview && <div><img src={preview} alt="preview" width="300" /></div>}
        <button onClick={uploadFile} disabled={!canUpload} style={{ marginTop: 8 }}>
          Upload to S3
        </button>

        {uploadedUrl && (
          <p style={{ marginTop: 8 }}>
            File URL: <a href={uploadedUrl} target="_blank" rel="noreferrer">{uploadedUrl}</a>
          </p>
        )}
      </div>

      {/* Pricing Table + Choose Plan */}
      <div>
        <h3>Pricing</h3>
        {loadingPricing ? (
          <p>Loading pricing…</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Plan</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Billing</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Price</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Features</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => {
                const isChosen = subscription?.plan_id === p.plan_id;
                return (
                  <tr key={p.plan_id} style={{ background: isChosen ? "#f6ffed" : "transparent" }}>
                    <td style={{ border: "1px solid #ccc", padding: 8 }}>{p.name}</td>
                    <td style={{ border: "1px solid #ccc", padding: 8 }}>{p.billing_period}</td>
                    <td style={{ border: "1px solid #ccc", padding: 8 }}>
                      ${(p.effective_price_cents / 100).toFixed(2)} {p.currency}
                      {p.effective_price_cents !== p.list_price_cents && (
                        <span style={{ marginLeft: 8, color: "#888", textDecoration: "line-through" }}>
                          ${(p.list_price_cents / 100).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: 8 }}>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {(p.features || []).map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: 8 }}>
                      <button disabled={subLoading || isChosen || !session?.user} onClick={() => choosePlan(p)}>
                        {isChosen ? "Selected" : (session?.user ? "Choose Plan" : "Sign in first")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

export default App;
