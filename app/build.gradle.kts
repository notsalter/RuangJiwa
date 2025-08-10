plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.example.ruangjiwa"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.ruangjiwa"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    
    buildFeatures {
        viewBinding = true
    }
}

dependencies {

    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.activity)
    implementation(libs.constraintlayout)
    
    // Fragment Navigation
    implementation("androidx.navigation:navigation-fragment:2.7.6")
    implementation("androidx.navigation:navigation-ui:2.7.6")
    
    // ViewPager2 for tab navigation
    implementation("androidx.viewpager2:viewpager2:1.0.0")
    
    // RecyclerView
    implementation("androidx.recyclerview:recyclerview:1.3.2")
    
    // CardView - using Material Components instead of legacy CardView
    implementation("com.google.android.material:material:1.10.0")
    
    // Charts library - commented out temporarily to debug build issues
    // implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")
    
    // Remove calendar library for now
    // implementation("com.github.prolificinteractive:material-calendarview:2.0.1")
    
    // Media Player
    implementation("androidx.media:media:1.7.0")
    
    // CircleImageView
    implementation("de.hdodenhof:circleimageview:3.1.0")
    
    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)
}