# Kişisel Build Notları

Bu doküman `build/personal` branch'indeki kişisel Folo build'inin durumunu, alınan kararları ve build/yenileme adımlarını tutar. Claude ile yeni bir oturuma başlarken "`PERSONAL_BUILD.md`'yi oku" demek yeterli; her şeyi yeniden anlatmaya gerek yok.

Son güncelleme: 2026-10-31

## Hızlı Başlangıç: 7 Gün Sonra iOS Yenileme

iOS uygulaması ücretsiz Apple hesabıyla imzalandığı için **7 günde bir** yeniden imzalanıp kurulmalı. Süre dolunca uygulama açılmaz ama veriler silinmez; aynı paket kimliğiyle yeniden kurunca kaldığı yerden devam eder.

**Şu anki iOS profilinin bitişi: 2026-11-07 Cumartesi 11:20 (+03)**

1. iPhone'u USB ile bağla, kilidini aç.
2. Aşağıdaki komutları çalıştır (repo kökünden):

   ```bash
   cd apps/mobile/ios
   export PATH=/opt/homebrew/opt/node@22/bin:$PATH NODE_ENV=production
   xcodebuild -workspace Folo.xcworkspace -scheme Folo -configuration Release \
     -destination 'id=00008110-001A59340193801E' -derivedDataPath build \
     -allowProvisioningUpdates -allowProvisioningDeviceRegistration build
   xcrun devicectl device install app --device 00008110-001A59340193801E \
     build/Build/Products/Release-iphoneos/Folo.app
   ```

3. Yeni bitiş tarihini kontrol et:

   ```bash
   security cms -D -i build/Build/Products/Release-iphoneos/Folo.app/embedded.mobileprovision \
     | plutil -extract ExpirationDate raw -
   ```

4. Bu dokümandaki "Şu anki iOS profilinin bitişi" satırını güncelle.

Sık karşılaşılan sorunlar:

- **"login details … were rejected"**: Xcode'daki Apple ID oturumu düşmüş. Xcode → Settings → Accounts'tan yeniden giriş yap.
- **Cihaz `unpaired` görünüyor**: `xcrun devicectl manage pair --device 00008110-001A59340193801E` çalıştır, telefonda "Güven" de. Geliştirici Modu açık (Ayarlar → Gizlilik ve Güvenlik).
- **"profile has not been explicitly trusted"**: iPhone'da Ayarlar → Genel → VPN ve Aygıt Yönetimi → Geliştirici Uygulaması → Güven.
- **`Pods/` silinmişse**: `cd apps/mobile/ios && pod install` (Node 22 PATH'te olmalı).
- **`out/rn-web` silinmişse**: `cd apps/mobile/web-app && pnpm build`. Makale içeriğini gösteren web paketi buradan uygulamaya gömülür.

## Ne Yapıldı (2026-10-30 / 31)

Hepsi `build/personal` branch'inde, `origin/build/personal` olarak push'landı (`github.com/emreihtiyar/Folo`).

| Commit                     | Ne yapıyor                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `3b73286e3` feat(i18n)     | Türkçe dil desteği (tüm `locales/*/tr.json`, desktop/mobile/ssr dil listeleri)                                                                                     |
| `d848042e8` fix(ai)        | Arayüz dilini AI desteklemiyorsa AI dili İngilizceye düşer (sunucu `tr` için 422 dönüyordu)                                                                        |
| `690ff354d` feat(ai)       | Türkçe çeviri istemcide DeepL ile yapılır. Folo AI yalnızca en/ja/zh-CN/zh-TW kabul ediyor. Özetler İngilizce gelir.                                               |
| `0475b972d` chore(desktop) | Kişisel build'de auto-update kapalı                                                                                                                                |
| `f44ba0483` fix(env)       | Production adresleri `api.follow.is` yerine `api.folo.is` (eski domain 301 veriyor, CORS bozuluyordu)                                                              |
| `af64edd27` fix(ai)        | Dil tanıma hatası: franc'a tek aday olarak Türkçe verilince her Latin metin "Türkçe" sayılıyordu, çeviri hiç gitmiyordu                                            |
| `cc1abafe9` chore(desktop) | Free planda AI özet/çeviri butonlarındaki plan kontrolü kaldırıldı; AI çeviri varsayılan araç çubuğunda                                                            |
| `917c2a7f9` feat(mobile)   | Mobilde "DeepL API Anahtarı" ayarı (AI dili Türkçeyken görünür)                                                                                                    |
| `d6c0e3116` fix(mobile)    | Yeni Xcode için Podfile düzeltmeleri (pod hedefleri ≥ iOS 15.1, `fmt` C++17, context-menu iOS 16)                                                                  |
| `e3268e283` chore(mobile)  | iOS kişisel ekip ile imzalanır, paket kimliği `com.emreihtiyar.folo`, push ve Apple ile Giriş yetkileri kaldırıldı                                                 |
| `5dac0808b` fix(mobile)    | iOS 27 SDK'sı UIScene yaşam döngüsü kullanmayan uygulamaları açılışta çökertiyor; React Native artık `SceneDelegate`'ten başlatılıyor (`AppDelegate.swift` içinde) |

## Şu Anki Durum

| Platform        | Durum                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| macOS (desktop) | `/Applications/Folo.app` kurulu, ad-hoc imzalı, arm64                                                    |
| Android         | Huawei HMW-W09 tablete kurulu (HarmonyOS 2.1 / Android 10). APK: `~/Downloads/Folo-personal-android.apk` |
| iOS             | iPhone 13'e (`iPhone14,5`, iOS 27.2) kurulu, ücretsiz kişisel ekip (`9RX6P3D8W8`) ile imzalı, 7 günlük   |

DeepL anahtarı desktop'ta ve Android tablette girildi; ayarlarda cihazda saklanır, ayar senkronizasyonuna dahil değil. iOS'ta anahtar her cihazda ayrıca girilmeli (Ayarlar → Genel → DeepL API Anahtarı). Anahtar bu dokümanda tutulmuyor çünkü repo GitHub'a push'lanıyor.

## Kararlar ve Kısıtlar

- **Apple ID ile giriş ve push bildirimi kullanılmayacak.** Bu yüzden iOS'ta ilgili yetkiler kaldırıldı; ücretsiz hesap zaten desteklemiyor.
- **Ücretli Apple Developer hesabı yok.** iOS build'i 7 günde bir yenilenecek. Kullanıma göre ileride şunlardan biri değerlendirilecek:
  - **SideStore / AltStore**: Aynı ücretsiz 7 günlük sertifikayı otomatik yeniler (aynı anda 3 uygulama, haftada 10 uygulama kimliği sınırı). Apple'ın ücretsiz provisioning mekanizmasını kullanır ama Xcode'u taklit ederek; Apple resmen onaylamıyor, yıllardır da engellemiyor. Kullanılırsa ikincil bir Apple ID önerilir.
  - **Ücretli hesap (yıllık 99 $)**: 1 yıllık profil veya TestFlight (her build 90 gün). Sınırı kaldıran tek yol.
  - TrollStore konu dışı bırakıldı.
- **Hesapta koşulsuz bir "Translate" Actions kuralı var.** Her makaleye `translation: true` ekliyor, bu yüzden desktop'ta AI çeviri butonu bilerek gizli ve çeviri otomatik geliyor. Butonla açıp kapatmak istenirse kural kapatılmalı.
- **AI özet Folo sunucusundan gelir.** Butonlar Free planda tıklanabilir ama sunucu Free plan isteklerini reddederse özet boş kalır.

## Build Tarifleri

### macOS (desktop)

```bash
cd apps/desktop
export PATH=/opt/homebrew/opt/node@22/bin:$PATH
VITE_API_URL=https://api.folo.is VITE_WEB_URL=https://app.folo.is VITE_IMGPROXY_URL= \
  pnpm exec electron-vite build
grep -rlE 'localhost:(3000|5173|2873)' dist   # boş çıkmalı
node -e "require('@electron-forge/core').api.package({dir: process.cwd(), interactive: false, arch: 'arm64', platform: 'darwin'})"
codesign --force --deep --sign - out/Folo-darwin-arm64/Folo.app
# Folo'yu kapat, sonra:
rm -rf /Applications/Folo.app && ditto out/Folo-darwin-arm64/Folo.app /Applications/Folo.app
```

Neden böyle:

- `apps/desktop/.env` yerel geliştirme için `localhost:3000` içeriyor ve Vite bunu production build'e gömüyor. Değişkenler komutta ezilir, `.env`'e dokunulmaz (`dev:web` onu kullanıyor).
- Sistemdeki Node v26 ile electron-packager zip açarken sessizce çıkıyor, Node 22 kullanılır.
- Forge CLI'ın pnpm kontrolü pnpm 10'da hatalı başarısız oluyor, bu yüzden forge core API'si doğrudan çağrılır.
- Paketleyicinin ad-hoc imzası `codesign --verify --deep`'ten geçmiyor, yeniden imzalanır.

### Android

```bash
export PATH=/opt/homebrew/opt/node@22/bin:$PATH
(cd apps/mobile/web-app && pnpm build)
cd apps/mobile
PROFILE=production CI=1 pnpm exec expo prebuild --platform android --no-install
cd android
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home \
ANDROID_HOME=$HOME/Library/Android/sdk NODE_ENV=production PROFILE=production \
  ./gradlew assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
```

- APK debug anahtarıyla imzalı; Play Store'daki Folo'nun üzerine kurulamaz.
- Varsayılan JDK 27, React Native için JDK 17 kullanılır.
- Huawei tablette `adb` görünmezse: USB modunu "Yalnızca şarj" ↔ "Dosya aktarımı" arasında değiştir, USB hata ayıklamayı kapatıp aç.
- Huawei, `adb`'nin dokunma ve kaydırma göndermesini engelliyor (`INJECT_EVENTS`); `adb shell input text` ise çalışıyor (seçili alana metin yazmak için).

### iOS

İlk kurulum yapıldı; yenileme için yukarıdaki "Hızlı Başlangıç" yeterli. Sıfırdan kurulum gerekirse:

```bash
export PATH=/opt/homebrew/opt/node@22/bin:$PATH LANG=en_US.UTF-8
(cd apps/mobile/web-app && pnpm build)
cd apps/mobile/ios
printf 'export NODE_BINARY=/opt/homebrew/opt/node@22/bin/node\n' > .xcode.env.local
pod install
# ardından "Hızlı Başlangıç"taki xcodebuild ve devicectl komutları
```

- `ios/` dizini repoda tutuluyor; `expo prebuild` iOS için çalıştırılmaz.
- Uygulama açılır açılmaz çökerse çökme kayıtlarını al ve oku:
  `xcrun devicectl device copy from --device 00008110-001A59340193801E --domain-type systemCrashLogs --source / --destination <klasör>` (`Folo-*.ips` dosyaları).
- Firebase yapılandırması eski paket kimliğine (`is.follow`) göre; çökme raporlaması bu build'de muhtemelen çalışmaz, uygulamayı etkilemez.

## Bilinen Eksikler

- Mobil giriş ekranındaki "Email", "Password", "Continue" metinleri kodda sabit İngilizce (`apps/mobile/src/modules/login/email.tsx`); dil dosyalarını kullanmıyor.
- `af64edd27` (dil tanıma düzeltmesi) DeepL özelliğinin bir hatası; upstream'e PR açılacaksa `feat/deepl-translation` branch'ine de alınmalı. Plan kontrolü ve imzalama commit'leri yalnızca kişisel build için.
