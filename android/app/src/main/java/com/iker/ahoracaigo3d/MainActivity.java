package com.iker.ahoracaigo3d;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.webkit.ValueCallback;
import android.graphics.Color;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.widget.FrameLayout;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/** ¡Ahora Caigo! 3D: el juego web (assets/www) dentro de un WebView a pantalla completa y en horizontal. */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private GameWebView web;
    private FrameLayout root;
    private static final int REQ_FILE = 4201;
    private ValueCallback<Uri[]> fileCb;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= 28) {
            w.getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        web = new GameWebView(this);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        web.setBackgroundColor(Color.BLACK);
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setHapticFeedbackEnabled(false);
        web.setOnLongClickListener(v -> true);
        web.setLongClickable(false);
        web.setWebViewClient(new AssetClient());
        web.setWebChromeClient(new GameChrome());
        web.addJavascriptInterface(new KbBridge(), "AndroidKb");
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        // En pantalla completa Android ignora adjustResize: ajustamos la altura del WebView a mano
        root.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
            Rect r = new Rect();
            root.getWindowVisibleDisplayFrame(r);
            int full = root.getRootView().getHeight();
            int kb = full - r.bottom;
            FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) web.getLayoutParams();
            int h = kb > full * 0.15 ? r.bottom : ViewGroup.LayoutParams.MATCH_PARENT;
            if (lp.height != h) { lp.height = h; web.setLayoutParams(lp); }
        });
        hideSystemUi();
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START);
    }

    /** Sirve los ficheros de assets/www desde un origen https (fetch(), audio y el iframe del modo Clásico funcionan igual que en la web). */
    private class AssetClient extends WebViewClient {
        private final Map<String, String> mime = new HashMap<>();
        AssetClient() {
            mime.put("html", "text/html"); mime.put("js", "text/javascript"); mime.put("css", "text/css");
            mime.put("json", "application/json"); mime.put("webmanifest", "application/manifest+json");
            mime.put("png", "image/png"); mime.put("webp", "image/webp"); mime.put("jpg", "image/jpeg");
            mime.put("svg", "image/svg+xml"); mime.put("mp3", "audio/mpeg"); mime.put("wav", "audio/wav");
            mime.put("woff2", "font/woff2"); mime.put("ico", "image/x-icon");
        }
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (!HOST.equals(u.getHost())) return null;
            String path = u.getPath();
            if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
            try {
                InputStream in = getAssets().open("www" + Uri.decode(path));
                String ext = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
                String m = mime.containsKey(ext) ? mime.get(ext) : "application/octet-stream";
                WebResourceResponse r = new WebResourceResponse(m, m.startsWith("text") || m.endsWith("json") ? "utf-8" : null, in);
                Map<String, String> h = new HashMap<>();
                h.put("Access-Control-Allow-Origin", "*");
                h.put("Cache-Control", "no-cache");
                r.setResponseHeaders(h);
                return r;
            } catch (Exception e) {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
            }
        }
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            return !HOST.equals(req.getUrl().getHost());
        }
    }

    /** Selector de archivos para <input type=file> (Opciones > Música de la cabecera).
     *  El audio elegido se queda en el almacenamiento del juego en ESTE dispositivo; la app no lo sube a ningún sitio. */
    private class GameChrome extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
            if (fileCb != null) fileCb.onReceiveValue(null);
            fileCb = cb;
            String type = "audio/*";
            String[] acc = params != null ? params.getAcceptTypes() : null;
            if (acc != null && acc.length > 0 && acc[0] != null && !acc[0].trim().isEmpty()) type = acc[0].trim();
            Intent i = new Intent(Intent.ACTION_GET_CONTENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType(type);
            try {
                startActivityForResult(Intent.createChooser(i, "Elige un audio"), REQ_FILE);
            } catch (Exception e) {
                fileCb = null;
                cb.onReceiveValue(null);
                return false;
            }
            return true;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE) {
            if (fileCb != null) {
                fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                fileCb = null;
            }
            hideSystemUi();
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    /** Puente para que el juego abra/cierre el teclado del movil cuando hay una pregunta. */
    private class KbBridge {
        @JavascriptInterface
        public void show() {
            runOnUiThread(() -> {
                if (web == null) return;
                web.requestFocus();
                InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                if (imm != null) imm.showSoftInput(web, InputMethodManager.SHOW_IMPLICIT);
            });
        }

        @JavascriptInterface
        public void hide() {
            runOnUiThread(() -> {
                if (web == null) return;
                InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                if (imm != null) imm.hideSoftInputFromWindow(web.getWindowToken(), 0);
                hideSystemUi();
            });
        }
    }

    @SuppressWarnings("deprecation")
    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) { web.onPause(); web.pauseTimers(); }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) { web.onResume(); web.resumeTimers(); }
        hideSystemUi();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        // Atras: el juego vuelve al menu anterior; en la portada se minimiza la app
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("(window.__back ? window.__back() : false)", v -> {
            if (!"true".equals(v)) moveTaskToBack(true);
        });
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
