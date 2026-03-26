package com.smartphoneautomation;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Button;
import android.view.View;

public class BlockedAppActivity extends Activity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_blocked_app);
        
        String appName = getIntent().getStringExtra("app_name");
        
        TextView messageText = findViewById(R.id.messageText);
        messageText.setText("Access Denied\n\n" + appName + "\n\nThis app is restricted for your role.");
        
        Button closeButton = findViewById(R.id.closeButton);
        closeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
    }
}
