import java.util.Properties

plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}

val keystoreProperties = Properties().apply {
  val propsFile = rootProject.file("keystore.properties")
  if (propsFile.exists()) {
    propsFile.inputStream().use { load(it) }
  }
}

fun signingProp(name: String): String? {
  val fromFile = keystoreProperties.getProperty(name)
  if (!fromFile.isNullOrBlank()) return fromFile
  val fromEnv = System.getenv(name)
  if (!fromEnv.isNullOrBlank()) return fromEnv
  return null
}

val releaseStoreFile = signingProp("RELEASE_STORE_FILE")
val releaseStorePassword = signingProp("RELEASE_STORE_PASSWORD")
val releaseKeyAlias = signingProp("RELEASE_KEY_ALIAS")
val releaseKeyPassword = signingProp("RELEASE_KEY_PASSWORD")

val hasReleaseSigning = !releaseStoreFile.isNullOrBlank()
  && !releaseStorePassword.isNullOrBlank()
  && !releaseKeyAlias.isNullOrBlank()
  && !releaseKeyPassword.isNullOrBlank()

val wantsReleaseBuild = gradle.startParameter.taskNames.any {
  it.contains("Release", ignoreCase = true)
}

if (wantsReleaseBuild && !hasReleaseSigning) {
  throw GradleException(
    "Missing release signing config. Set RELEASE_STORE_FILE, RELEASE_STORE_PASSWORD, RELEASE_KEY_ALIAS, RELEASE_KEY_PASSWORD in android-wrapper/keystore.properties or environment variables."
  )
}

android {
  namespace = "com.forestmerge.game2048"
  compileSdk = 35

  defaultConfig {
    applicationId = "com.forestmerge.game2048"
    minSdk = 24
    targetSdk = 35
    versionCode = 1
    versionName = "1.0.0"
    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
  }

  signingConfigs {
    create("release") {
      if (hasReleaseSigning) {
        storeFile = file(releaseStoreFile!!)
        storePassword = releaseStorePassword
        keyAlias = releaseKeyAlias
        keyPassword = releaseKeyPassword
      }
    }
  }

  buildTypes {
    release {
      isMinifyEnabled = false
      signingConfig = if (hasReleaseSigning) {
        signingConfigs.getByName("release")
      } else {
        signingConfigs.getByName("debug")
      }
      proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
      )
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlinOptions {
    jvmTarget = "17"
  }

  buildFeatures {
    viewBinding = true
  }
}

dependencies {
  implementation("androidx.core:core-ktx:1.13.1")
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("com.google.android.material:material:1.12.0")
  implementation("androidx.webkit:webkit:1.11.0")
  implementation("com.google.android.gms:play-services-ads:23.6.0")
}
