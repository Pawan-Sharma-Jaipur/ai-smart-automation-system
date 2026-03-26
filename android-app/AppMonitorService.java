package com.smartphoneautomation;

import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;
import java.util.ArrayList;
import java.util.List;

public class AppMonitorService extends Service {
    
    private static final String CHANNEL_ID = "AppLockChannel";
    private static final int NOTIFICATION_ID = 1;
    private Handler handler;
    private Runnable monitorRunnable;
    private List<String> blockedApps = new ArrayList<>();
    private String currentForegroundApp = "";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        handler = new Handler();
        monitorRunnable = new Runnable() {
            @Override
            public void run() {
                checkForegroundApp();
                handler.postDelayed(this, 500); // Check every 500ms
            }
        };
        handler.post(monitorRunnable);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            blockedApps = intent.getStringArrayListExtra("blocked_apps");
            if (blockedApps == null) {
                blockedApps = new ArrayList<>();
            }
        }
        return START_STICKY;
    }

    private void checkForegroundApp() {
        String foregroundApp = getForegroundApp();
        
        if (foregroundApp != null && !foregroundApp.equals(currentForegroundApp)) {
            currentForegroundApp = foregroundApp;
            
            if (blockedApps.contains(foregroundApp)) {
                // Block the app - go to home screen
                Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                homeIntent.addCategory(Intent.CATEGORY_HOME);
                homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(homeIntent);
                
                // Show block message
                Intent blockIntent = new Intent(this, BlockedAppActivity.class);
                blockIntent.putExtra("app_name", foregroundApp);
                blockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(blockIntent);
            }
        }
    }

    private String getForegroundApp() {
        ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        if (am != null) {
            List<ActivityManager.RunningAppProcessInfo> processes = am.getRunningAppProcesses();
            if (processes != null && !processes.isEmpty()) {
                for (ActivityManager.RunningAppProcessInfo process : processes) {
                    if (process.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND) {
                        return process.processName;
                    }
                }
            }
        }
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "App Lock Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitoring app access based on user role");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("App Lock Active")
                .setContentText("Role-based access control is running")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && monitorRunnable != null) {
            handler.removeCallbacks(monitorRunnable);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
