# Printer thermal — panduan koneksi

Paylo mencetak struk sebagai **byte ESC/POS**, bukan lewat dialog cetak browser.
Kode ada di [`resources/js/lib/printing/`](../resources/js/lib/printing/); setiap
cara mengirim byte disebut *transport*.

---

## Batas yang tidak bisa dilewati kode mana pun

Browser **tidak punya API untuk membuka socket Bluetooth Classic (SPP/RFCOMM)**.
Web Bluetooth hanya bicara Bluetooth Low Energy (BLE).

Printer struk murah (POS-58, RPP02N, Panda, Eppos) hampir selalu Classic saja.
Pairing yang tersimpan di Pengaturan Android dipegang sistem operasi dan hanya
bisa dipakai aplikasi native — itulah sebabnya aplikasi printer dari Play Store
langsung menemukan printer Anda sementara tab browser tidak akan pernah bisa.

Konsekuensinya jelas: **kalau printernya Classic dan Anda tidak mau aplikasi
pihak ketiga, Paylo sendiri yang harus menjadi aplikasinya.** Itu Jalur D.

---

## Pilih jalur

| Jalur | Cocok untuk | Aplikasi tambahan | Biaya |
| --- | --- | --- | --- |
| **A. Bluetooth (BLE)** | Printer yang juga punya BLE | Tidak ada | Gratis |
| **B. USB OTG** | Printer apa pun, tablet Android | Tidak ada | Harga kabel |
| **C. Serial / COM** | Terminal Windows | Tidak ada | Gratis |
| **D. APK Paylo sendiri** | **Printer Bluetooth Classic** | Tidak ada | Gratis |
| E. RawBT / POSBridge | Jalan pintas sementara | Ya, pihak ketiga | Lisensinya sendiri |

Semua jalur butuh Paylo dibuka lewat **HTTPS** (kecuali D, yang memakai
WebView-nya sendiri). Pada `http://` biasa browser mematikan Bluetooth, USB, dan
Serial sepenuhnya — ini sering jadi satu-satunya penyebab kegagalan.

---

## Jalur A — cek dulu, printer Anda mungkin BLE

Banyak printer yang dijual sebagai "Bluetooth" ternyata juga mengiklankan
service BLE. Lima belas detik untuk memastikan:

1. Buka **Pengaturan → Struk & printer**.
2. Tekan **Uji printer BLE**, pilih printer Anda di daftar yang muncul.
3. Baca hasilnya di panel **Diagnosa koneksi**.

- Berhasil → pilih jalur **Bluetooth (BLE)**, simpan, selesai. Tanpa aplikasi apa pun.
- "tidak ada jalur tulis" → printer Anda Classic saja. Lanjut ke Jalur B atau D.

UUID service yang dikenali ada di
[`transport-bluetooth.ts`](../resources/js/lib/printing/transport-bluetooth.ts);
printer yang tidak terdaftar tetap dicoba, karena Paylo menerima karakteristik
apa pun yang bisa ditulis.

## Jalur B — USB OTG

Melewati Bluetooth sepenuhnya, jadi berlaku untuk printer Classic maupun BLE.

1. Sambungkan printer ke tablet dengan kabel USB OTG.
2. Pilih jalur **USB**, tekan **Hubungkan printer**, izinkan saat Chrome meminta.

Di Windows, printer USB harus tidak dipegang spooler sistem; kalau
`claimInterface` ditolak, ganti driver-nya ke WinUSB dengan Zadig.

## Jalur C — Serial / COM (Windows)

Memasangkan printer Bluetooth Classic di Windows membuat **port COM keluar**.
Web Serial bisa membukanya, jadi terminal Windows tidak perlu aplikasi apa pun:
pilih jalur **Serial / COM**, tekan Hubungkan, pilih port-nya. Baud 9600.

---

## Jalur D — jadikan Paylo aplikasi Android sendiri

Ini jawaban permanen untuk printer Bluetooth Classic, tanpa lisensi pihak
ketiga. Paylo dibungkus Capacitor menjadi APK milik Anda; di dalamnya Paylo
membaca daftar printer yang sudah dipasangkan Android dan membuka socket SPP-nya
langsung. Halaman pengaturan otomatis menampilkan panel **Printer terpasang di
perangkat** begitu APK itu berjalan.

Isi web-nya tetap dilayani server Laravel Anda, jadi setiap deploy langsung
terpakai tanpa build ulang APK.

### Prasyarat

- Node 20+, JDK 17, Android Studio (atau Android SDK + Gradle).
- Paylo sudah bisa diakses dari tablet lewat sebuah URL.

### 1. Pasang Capacitor

```bash
npm install @capacitor/core @capacitor/android && npm install -D @capacitor/cli
```

```bash
npx cap init Paylo coffee.paylo.app --web-dir=public
```

### 2. Arahkan APK ke server Paylo

`capacitor.config.ts` di akar repositori:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'coffee.paylo.app',
    appName: 'Paylo',
    // Tidak dipakai selama `server.url` diisi, tapi wajib ada.
    webDir: 'public',
    server: {
        // Ganti dengan alamat Paylo Anda.
        url: 'https://kasir.namatoko.com',
        androidScheme: 'https',
        // Isi true HANYA kalau server masih http di jaringan lokal.
        cleartext: false,
    },
};

export default config;
```

```bash
npx cap add android
```

### 3. Tambahkan jembatan printer

`android/app/src/main/java/coffee/paylo/app/PayloPrinterPlugin.java`:

```java
package coffee.paylo.app;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.OutputStream;
import java.util.UUID;

/**
 * Jembatan SPP untuk Paylo. Kontraknya dibaca oleh
 * resources/js/lib/printing/transport-native.ts.
 */
@CapacitorPlugin(
    name = "PayloPrinter",
    permissions = {
        @Permission(
            alias = "bluetooth",
            strings = { Manifest.permission.BLUETOOTH_CONNECT }
        )
    }
)
public class PayloPrinterPlugin extends Plugin {

    /** UUID Serial Port Profile — sama untuk semua printer ESC/POS. */
    private static final UUID SPP =
        UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private BluetoothSocket socket;
    private OutputStream stream;

    @PluginMethod
    public void list(PluginCall call) {
        if (getPermissionState("bluetooth") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("bluetooth", call, "afterPermission");
            return;
        }

        respondWithDevices(call);
    }

    @PermissionCallback
    private void afterPermission(PluginCall call) {
        if (getPermissionState("bluetooth") != com.getcapacitor.PermissionState.GRANTED) {
            call.reject("Izin Bluetooth ditolak.");
            return;
        }

        respondWithDevices(call);
    }

    private void respondWithDevices(PluginCall call) {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();

        if (adapter == null || !adapter.isEnabled()) {
            call.reject("Bluetooth mati atau tidak tersedia.");
            return;
        }

        JSArray devices = new JSArray();

        try {
            for (BluetoothDevice device : adapter.getBondedDevices()) {
                JSObject entry = new JSObject();
                entry.put("id", device.getAddress());
                entry.put("name", device.getName());
                devices.put(entry);
            }
        } catch (SecurityException error) {
            call.reject("Izin Bluetooth ditolak.");
            return;
        }

        JSObject result = new JSObject();
        result.put("devices", devices);
        call.resolve(result);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String id = call.getString("id");

        if (id == null) {
            call.reject("id printer wajib diisi.");
            return;
        }

        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();

        if (adapter == null || !adapter.isEnabled()) {
            call.reject("Bluetooth mati atau tidak tersedia.");
            return;
        }

        try {
            closeQuietly();

            BluetoothDevice device = adapter.getRemoteDevice(id);

            adapter.cancelDiscovery();
            socket = device.createRfcommSocketToServiceRecord(SPP);
            socket.connect();
            stream = socket.getOutputStream();

            JSObject result = new JSObject();
            result.put("id", device.getAddress());
            result.put("name", device.getName());
            call.resolve(result);
        } catch (Exception error) {
            closeQuietly();
            call.reject("Gagal membuka printer: " + error.getMessage());
        }
    }

    @PluginMethod
    public void write(PluginCall call) {
        String data = call.getString("data");

        if (data == null) {
            call.reject("data base64 wajib diisi.");
            return;
        }

        if (stream == null) {
            call.reject("Printer belum terhubung.");
            return;
        }

        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);

            // Printer murah gampang kelebihan buffer; kirim per potong.
            int chunk = 512;

            for (int offset = 0; offset < bytes.length; offset += chunk) {
                int size = Math.min(chunk, bytes.length - offset);
                stream.write(bytes, offset, size);
                stream.flush();
                Thread.sleep(20);
            }

            call.resolve();
        } catch (Exception error) {
            closeQuietly();
            call.reject("Gagal mengirim ke printer: " + error.getMessage());
        }
    }

    @PluginMethod
    public void isConnected(PluginCall call) {
        JSObject result = new JSObject();
        result.put("connected", socket != null && socket.isConnected());
        call.resolve(result);
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        closeQuietly();
        call.resolve();
    }

    private void closeQuietly() {
        try {
            if (stream != null) {
                stream.close();
            }

            if (socket != null) {
                socket.close();
            }
        } catch (Exception ignored) {
            // Sudah tertutup.
        } finally {
            stream = null;
            socket = null;
        }
    }
}
```

Daftarkan di `android/app/src/main/java/coffee/paylo/app/MainActivity.java`:

```java
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PayloPrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

Izin di `android/app/src/main/AndroidManifest.xml`, di dalam `<manifest>`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

### 4. Build

```bash
npx cap sync android
```

```bash
cd android && ./gradlew assembleDebug
```

APK-nya ada di `android/app/build/outputs/apk/debug/app-debug.apk`. Pasang di
tablet kasir. Untuk rilis, tandatangani dengan `assembleRelease` dan keystore
Anda sendiri.

### 5. Verifikasi

Buka **Pengaturan → Struk & printer** di dalam APK:

- Diagnosa baris pertama, *Aplikasi Paylo sendiri (jalur mandiri)*, harus centang.
- Panel **Printer terpasang di perangkat** menampilkan printer yang sudah dipasangkan.
- Tekan **Pakai ini** → **Tes cetak**.

Kalau daftarnya kosong, pasangkan printer dulu di Pengaturan Android → Bluetooth.

---

## Kontrak jembatan

Jalur D tidak terikat Capacitor. Shell apa pun — Cordova, TWA dengan
`addJavascriptInterface`, WebView Flutter — cukup menyediakan objek ini sebelum
halaman Paylo dimuat:

```js
window.PayloPrinter = {
    list(),          // → Promise<{id, name}[] | {devices: {id, name}[]}>
    connect({ id }), // → Promise<{id, name} | void>
    write({ data }), // data = base64 ESC/POS → Promise<void>
    disconnect(),    // → Promise<void>
    isConnected(),   // → Promise<boolean | {connected: boolean}>
};
```

Plugin Capacitor bernama `PayloPrinter` juga terbaca otomatis lewat
`window.Capacitor.Plugins.PayloPrinter`, jadi tidak perlu lem tambahan.

Kalau lebih suka plugin siap pakai daripada kode di atas, pasang salah satu
plugin SPP komunitas lalu ekspos `window.PayloPrinter` sebagai pembungkus tipis
di sekelilingnya — sisi Paylo tidak perlu diubah.

---

## Jalur E — aplikasi pihak ketiga (tidak dianjurkan)

Paylo masih mendukung jembatan **RawBT** (`rawbt:base64,…`) sebagai jalan pintas,
tetapi RawBT adalah aplikasi terpisah dengan lisensinya sendiri dan Paylo tidak
membutuhkannya. Alternatif sejenis yang sering disebut: **POSBridge** (bridge
deep-link untuk aplikasi web), **Simple Bluetooth Printer**, dan **ESC POS
Bluetooth Print Service**. Semuanya tetap berarti satu aplikasi tambahan di luar
kendali Anda — Jalur D menghilangkan ketergantungan itu sepenuhnya.
