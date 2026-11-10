package io.horizontalsystems.bankwallet.modules.wallpaper;

import android.graphics.Canvas;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Movie;
import android.graphics.Paint;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.service.wallpaper.WallpaperService;
import android.view.SurfaceHolder;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.InputStream;

import io.horizontalsystems.bankwallet.core.wallpaper.WalletWallpaperManager;

public class WalletModeWallpaperService extends WallpaperService {
    @Override
    public Engine onCreateEngine() {
        return new WalletModeEngine();
    }

    private final class WalletModeEngine extends Engine {
        private final Handler mainHandler = new Handler(Looper.getMainLooper());
        private final Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Runnable renderRunnable = new Runnable() {
            @Override
            public void run() {
                renderWebFrame();
                if (shouldRenderWeb()) {
                    mainHandler.postDelayed(this, frameDelayMs());
                }
            }
        };

        private SurfaceHolder surfaceHolder;
        private WebView webView;
        private final BackgroundLayer backgroundLayer = new BackgroundLayer();
        private int surfaceWidth = 1;
        private int surfaceHeight = 1;
        private boolean surfaceReady;
        private boolean visible;
        private boolean webLoopRunning;
        private String activeAccount = "";
        private String activeBarcodeArtUri = "";

        @Override
        public void onCreate(SurfaceHolder holder) {
            super.onCreate(holder);
            surfaceHolder = holder;
            textPaint.setColor(Color.WHITE);
            textPaint.setTextSize(34f);
        }

        @Override
        public void onSurfaceCreated(SurfaceHolder holder) {
            super.onSurfaceCreated(holder);
            surfaceHolder = holder;
            surfaceReady = true;
            reloadContent();
        }

        @Override
        public void onSurfaceChanged(SurfaceHolder holder, int format, int width, int height) {
            super.onSurfaceChanged(holder, format, width, height);
            surfaceHolder = holder;
            surfaceWidth = Math.max(1, width);
            surfaceHeight = Math.max(1, height);
            layoutWebView();
            renderWebFrame();
        }

        @Override
        public void onVisibilityChanged(boolean isVisible) {
            super.onVisibilityChanged(isVisible);
            visible = isVisible;
            if (isVisible) {
                if (webView == null) {
                    reloadContent();
                } else {
                    webView.onResume();
                    startWebLoop();
                }
            } else {
                if (webView != null) {
                    webView.onPause();
                }
                stopWebLoop();
            }
        }

        @Override
        public void onSurfaceDestroyed(SurfaceHolder holder) {
            super.onSurfaceDestroyed(holder);
            surfaceReady = false;
            stopWebLoop();
        }

        @Override
        public void onDestroy() {
            stopWebLoop();
            destroyWebView();
            super.onDestroy();
        }

        private void reloadContent() {
            if (!surfaceReady || surfaceHolder == null) {
                return;
            }

            String account = WalletWallpaperManager.INSTANCE.savedAccount(WalletModeWallpaperService.this);
            if (account == null || account.trim().isEmpty()) {
                drawStatus("Open USPS Wallet and set Device Wallpaper from Settings.");
                return;
            }

            String barcodeArtUri = WalletWallpaperManager.INSTANCE.savedBarcodeArtUri(WalletModeWallpaperService.this);
            if (barcodeArtUri == null) {
                barcodeArtUri = "";
            }

            if (account.equals(activeAccount) && barcodeArtUri.equals(activeBarcodeArtUri) && webView != null) {
                return;
            }

            activeAccount = account;
            activeBarcodeArtUri = barcodeArtUri;
            destroyWebView();
            setupWebView(WalletWallpaperManager.INSTANCE.localBarcodeUrl(WalletModeWallpaperService.this, account));
        }

        private void setupWebView(String url) {
            webView = new WebView(WalletModeWallpaperService.this);
            webView.setBackgroundColor(Color.TRANSPARENT);
            webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setVerticalScrollBarEnabled(false);

            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setLoadsImagesAutomatically(true);
            settings.setLoadWithOverviewMode(true);
            settings.setUseWideViewPort(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(false);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                settings.setAllowFileAccessFromFileURLs(true);
                settings.setAllowUniversalAccessFromFileURLs(false);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            }

            webView.setWebChromeClient(new WebChromeClient());
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    Uri uri = request.getUrl();
                    return uri == null || !"file".equalsIgnoreCase(uri.getScheme());
                }

                @SuppressWarnings("deprecation")
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    return url == null || !url.startsWith("file:///android_asset/");
                }

                @Override
                public void onPageFinished(WebView view, String url) {
                    renderWebFrame();
                }

                @Override
                public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                    if (request.isForMainFrame()) {
                        drawStatus("Wallet Mode failed to load.");
                    }
                }
            });

            layoutWebView();
            webView.loadUrl(url);
            webView.onResume();
            startWebLoop();
        }

        private void layoutWebView() {
            if (webView == null) {
                return;
            }
            int widthSpec = View.MeasureSpec.makeMeasureSpec(surfaceWidth, View.MeasureSpec.EXACTLY);
            int heightSpec = View.MeasureSpec.makeMeasureSpec(surfaceHeight, View.MeasureSpec.EXACTLY);
            webView.measure(widthSpec, heightSpec);
            webView.layout(0, 0, surfaceWidth, surfaceHeight);
        }

        private void startWebLoop() {
            if (webLoopRunning || webView == null) {
                return;
            }
            webLoopRunning = true;
            mainHandler.post(renderRunnable);
        }

        private void stopWebLoop() {
            webLoopRunning = false;
            mainHandler.removeCallbacks(renderRunnable);
        }

        private boolean shouldRenderWeb() {
            return webLoopRunning && visible && surfaceReady && webView != null
                    && surfaceHolder != null
                    && surfaceHolder.getSurface() != null
                    && surfaceHolder.getSurface().isValid();
        }

        private long frameDelayMs() {
            int fps = WalletWallpaperManager.INSTANCE.savedFps(WalletModeWallpaperService.this);
            fps = Math.max(5, Math.min(30, fps));
            return Math.max(16L, Math.round(1000f / fps));
        }

        private void renderWebFrame() {
            if (!shouldRenderWeb()) {
                return;
            }
            Canvas canvas = null;
            try {
                canvas = surfaceHolder.lockCanvas();
                if (canvas == null) {
                    return;
                }
                canvas.drawColor(Color.BLACK);
                backgroundLayer.draw(canvas);
                canvas.save();
                float scaleX = canvas.getWidth() / (float) surfaceWidth;
                float scaleY = canvas.getHeight() / (float) surfaceHeight;
                canvas.scale(scaleX, scaleY);
                webView.draw(canvas);
                canvas.restore();
            } catch (IllegalArgumentException | IllegalStateException ignored) {
                // The launcher can swap or destroy wallpaper surfaces while rendering.
            } finally {
                if (canvas != null) {
                    try {
                        surfaceHolder.unlockCanvasAndPost(canvas);
                    } catch (IllegalArgumentException ignored) {
                    }
                }
            }
        }

        private void destroyWebView() {
            stopWebLoop();
            backgroundLayer.clear();
            if (webView == null) {
                return;
            }
            webView.stopLoading();
            webView.loadUrl("about:blank");
            webView.onPause();
            webView.destroy();
            webView = null;
        }

        private void drawStatus(String message) {
            if (surfaceHolder == null || !surfaceReady
                    || surfaceHolder.getSurface() == null
                    || !surfaceHolder.getSurface().isValid()) {
                return;
            }
            Canvas canvas = null;
            try {
                canvas = surfaceHolder.lockCanvas();
                if (canvas == null) {
                    return;
                }
                canvas.drawColor(Color.BLACK);
                drawWrappedText(canvas, message, 48f, Math.max(96f, canvas.getHeight() / 3f));
            } catch (IllegalArgumentException | IllegalStateException ignored) {
            } finally {
                if (canvas != null) {
                    try {
                        surfaceHolder.unlockCanvasAndPost(canvas);
                    } catch (IllegalArgumentException ignored) {
                    }
                }
            }
        }

        private void drawWrappedText(Canvas canvas, String message, float x, float y) {
            float maxWidth = Math.max(120f, canvas.getWidth() - x * 2f);
            String[] words = message.split(" ");
            StringBuilder line = new StringBuilder();
            float lineHeight = textPaint.getTextSize() * 1.35f;
            for (String word : words) {
                String candidate = line.length() == 0 ? word : line + " " + word;
                if (textPaint.measureText(candidate) > maxWidth && line.length() > 0) {
                    canvas.drawText(line.toString(), x, y, textPaint);
                    y += lineHeight;
                    line.setLength(0);
                    line.append(word);
                } else {
                    line.setLength(0);
                    line.append(candidate);
                }
            }
            if (line.length() > 0) {
                canvas.drawText(line.toString(), x, y, textPaint);
            }
        }

        private final class BackgroundLayer {
            private final Rect bitmapSrc = new Rect();
            private final Rect bitmapDst = new Rect();
            private String activeUri = "";
            private Bitmap bitmap;
            private Movie movie;
            private int movieDurationMs;

            void draw(Canvas canvas) {
                ensureLoaded();

                if (movie != null) {
                    drawMovie(canvas);
                } else if (bitmap != null && !bitmap.isRecycled()) {
                    drawBitmap(canvas);
                }
            }

            void clear() {
                activeUri = "";
                movie = null;
                movieDurationMs = 0;
                if (bitmap != null) {
                    bitmap.recycle();
                    bitmap = null;
                }
            }

            private void ensureLoaded() {
                String savedUri = WalletWallpaperManager.INSTANCE.savedBackgroundUri(WalletModeWallpaperService.this);
                if (savedUri == null) {
                    savedUri = "";
                }
                if (savedUri.equals(activeUri)) {
                    return;
                }

                clear();
                activeUri = savedUri;
                if (activeUri.isEmpty()) {
                    return;
                }

                Uri uri = Uri.parse(activeUri);
                String type = getContentResolver().getType(uri);
                if (type != null && type.toLowerCase().contains("gif")) {
                    loadMovie(uri);
                }
                if (movie == null) {
                    loadBitmap(uri);
                }
            }

            private void loadMovie(Uri uri) {
                try (InputStream inputStream = getContentResolver().openInputStream(uri)) {
                    movie = Movie.decodeStream(inputStream);
                    if (movie != null) {
                        movieDurationMs = Math.max(1000, movie.duration());
                    }
                } catch (Exception ignored) {
                    movie = null;
                    movieDurationMs = 0;
                }
            }

            private void loadBitmap(Uri uri) {
                try (InputStream inputStream = getContentResolver().openInputStream(uri)) {
                    bitmap = BitmapFactory.decodeStream(inputStream);
                } catch (Exception ignored) {
                    bitmap = null;
                }
            }

            private void drawBitmap(Canvas canvas) {
                int bitmapWidth = bitmap.getWidth();
                int bitmapHeight = bitmap.getHeight();
                if (bitmapWidth <= 0 || bitmapHeight <= 0) {
                    return;
                }

                float canvasRatio = canvas.getWidth() / (float) canvas.getHeight();
                float bitmapRatio = bitmapWidth / (float) bitmapHeight;
                if (bitmapRatio > canvasRatio) {
                    int cropWidth = Math.round(bitmapHeight * canvasRatio);
                    int left = Math.max(0, (bitmapWidth - cropWidth) / 2);
                    bitmapSrc.set(left, 0, Math.min(bitmapWidth, left + cropWidth), bitmapHeight);
                } else {
                    int cropHeight = Math.round(bitmapWidth / canvasRatio);
                    int top = Math.max(0, (bitmapHeight - cropHeight) / 2);
                    bitmapSrc.set(0, top, bitmapWidth, Math.min(bitmapHeight, top + cropHeight));
                }
                bitmapDst.set(0, 0, canvas.getWidth(), canvas.getHeight());
                canvas.drawBitmap(bitmap, bitmapSrc, bitmapDst, null);
            }

            private void drawMovie(Canvas canvas) {
                int movieWidth = movie.width();
                int movieHeight = movie.height();
                if (movieWidth <= 0 || movieHeight <= 0) {
                    return;
                }

                movie.setTime((int) (SystemClock.uptimeMillis() % movieDurationMs));
                float scale = Math.max(canvas.getWidth() / (float) movieWidth, canvas.getHeight() / (float) movieHeight);
                float dx = (canvas.getWidth() - movieWidth * scale) / 2f;
                float dy = (canvas.getHeight() - movieHeight * scale) / 2f;

                canvas.save();
                canvas.translate(dx, dy);
                canvas.scale(scale, scale);
                movie.draw(canvas, 0f, 0f);
                canvas.restore();
            }
        }
    }
}
