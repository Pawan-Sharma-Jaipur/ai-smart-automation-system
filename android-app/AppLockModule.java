package com.smartphoneautomation;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import com.facebook.react.bridge.*;
import java.util.*;

public class AppLockModule extends ReactContextBaseJavaModule {
    
    private static final String MODULE_NAME = "AppLockModule";
    private final ReactApplicationContext reactContext;
    
    // App package names to lock based on role
    private static final Map<String, List<String>> ROLE_RESTRICTIONS = new HashMap<String, List<String>>() {{
        put("VIEWER", Arrays.asList(
            "com.android.settings",           // Settings
            "com.android.vending",            // Play Store
            "com.android.chrome",             // Chrome
            "com.whatsapp",                   // WhatsApp
            "com.facebook.katana",            // Facebook
            "com.instagram.android",          // Instagram
            "com.android.contacts",           // Contacts
            "com.android.mms"                 // Messages
        ));
        
        put("DEVELOPER", Arrays.asList(
            "com.android.settings",           // Settings
            "com.android.vending",            // Play Store
            "com.sbi.lotusintouch",           // Banking apps
            "com.phonepe.app",
            "com.google.android.apps.nbu.paisa.user"
        ));
        
        put("TEAM_LEAD", Arrays.asList(
            "com.android.settings",           // Settings
            "com.sbi.lotusintouch",           // Banking
            "com.phonepe.app"
        ));
        
        put("ORG_ADMIN", Arrays.asList(
            "com.sbi.lotusintouch",           // Banking only
            "com.phonepe.app"
        ));
        
        put("SYSTEM_ADMIN", new ArrayList<>());  // No restrictions
    }};

    public AppLockModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void applyRoleRestrictions(String role, Promise promise) {
        try {
            List<String> blockedApps = ROLE_RESTRICTIONS.get(role);
            if (blockedApps == null) {
                blockedApps = new ArrayList<>();
            }
            
            // Start monitoring service
            Intent intent = new Intent(reactContext, AppMonitorService.class);
            intent.putStringArrayListExtra("blocked_apps", new ArrayList<>(blockedApps));
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent);
            } else {
                reactContext.startService(intent);
            }
            
            promise.resolve("Restrictions applied for role: " + role);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void checkUsagePermission(Promise promise) {
        try {
            AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactContext.getPackageName()
            );
            
            boolean granted = (mode == AppOpsManager.MODE_ALLOWED);
            promise.resolve(granted);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestUsagePermission() {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            
            WritableArray appList = Arguments.createArray();
            for (ApplicationInfo app : apps) {
                if ((app.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                    WritableMap appInfo = Arguments.createMap();
                    appInfo.putString("packageName", app.packageName);
                    appInfo.putString("appName", pm.getApplicationLabel(app).toString());
                    appList.pushMap(appInfo);
                }
            }
            
            promise.resolve(appList);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isAppBlocked(String packageName, String role, Promise promise) {
        List<String> blockedApps = ROLE_RESTRICTIONS.get(role);
        boolean blocked = blockedApps != null && blockedApps.contains(packageName);
        promise.resolve(blocked);
    }
}
