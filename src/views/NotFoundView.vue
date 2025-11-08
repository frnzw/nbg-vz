<template>
  <!-- A container to fill the viewport height and center the card -->
  <v-container class="fill-height d-flex align-center justify-center">
    <!-- Card component to hold the 404 message -->
    <v-card
      class="pa-8 d-flex flex-column align-center justify-center text-center"
      elevation="4"
    >
      <div>
        <!-- Large warning icon -->
        <v-icon
          icon="mdi-alert-outline"
          color="orange"
          size="96"
          class="mb-4"
        ></v-icon>

        <!-- Error headline -->
        <h1>404 - Seite nicht gefunden</h1>
        <!-- Error description -->
        <p>Die angeforderte Route existiert nicht.</p>
      </div>
    </v-card>
  </v-container>
</template>
