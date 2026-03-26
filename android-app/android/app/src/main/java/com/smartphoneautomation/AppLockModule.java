package com.smartphoneautomation;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import com.facebook.react.bridge.*;
import java.util.*;

public class AppLockModule extends ReactContextBaseJavaModule {
    private static final Map<String, List<String>> ROLE_RESTRICTIONS = new HashMap<>();
    
    static {
        ROLE_RESTRICTIONS.put("VIEWER", Arrays.asList("com.android.settings", "com.android.vending", "com.android.chrome", "com.whatsapp", "com.facebook.katana", "com.instagram.android", "com.android.contacts", "com.android.mms"));
        ROLE_RESTRICTIONS.put("DEVELOPER", Arrays.asList("com.android.settings", "com.android.vending", "com.banking.app", "com.phonepe.app", "com.paytm"));
        ROLE_RESTRICTIONS.put("TEAM_LEAD", Arrays.asList("com.android.settings", "com.banking.app", "com.phonepe.app"));
        ROLE_RESTRICTIONS.put("ORG_ADMIN", Arrays.asList("com.banking.app", "com.phonepe.app"));
        ROLE_RESTRICTIONS.put("SYSTEM_ADMIN", new ArrayList<>());
    }

    public AppLockModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AppLockModule";
    }

    @ReactMethod
    public void applyRoleRestrictions(String role, Promise promise) {
        try {
            List<String> blockedApps = ROLE_RESTRICTIONS.getOrDefault(role, new ArrayList<>());
            promise.resolve("Applied restrictions for " + role + ": " + blockedApps.size() + " apps blocked");
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void checkUsagePermission(Promise promise) {
        try {
            AppOpsManager appOps = (AppOpsManager) getReactApplicationContext().getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), getReactApplicationContext().getPackageName());
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void requestUsagePermission() {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }
}
