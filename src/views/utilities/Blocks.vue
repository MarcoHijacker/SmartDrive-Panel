<template>
    <div class="grid p-fluid">
      <div class="col-12">
        <div class="card">
          <h5>
            <i class="fas fa-upload mr-2"></i>
            Upload Collection Records
          </h5>
          <form @submit.prevent="handleSubmit">
            <div class="grid">
              <div class="col-12 lg:col-4 md:col-4 p-field">
                <Dropdown
                  v-model="selectedCollection"
                  :options="collections"
                  optionLabel="name"
                  placeholder="Select a Collection"
                />
              </div>
              <div class="col-12 lg:col-4 md:col-4 p-field my-auto">
                <label for="file" class="mr-2">Choose File</label>
                <input type="file" @change="handleFileChange" accept=".csv, .json" />
              </div>
              <div class="col-12 lg:col-4 md:col-4 p-field">
                <Button
                  label="Upload"
                  icon="fas fa-cloud-upload-alt"
                  class=""
                  type="submit"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import axios from "axios";
  import { useToast } from "primevue/usetoast";
  import "@fortawesome/fontawesome-free/css/all.css";
  
  const collections = ref([
    { name: "Samples", value: "samples" },
    { name: "Session", value: "session" },
    { name: "Test", value: "test" }
  ]);
  
  const selectedCollection = ref(null);
  const file = ref(null);
  const toast = useToast();
  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    const validExtensions = ["csv", "json"];
  
    if (selectedFile) {
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
  
      if (validExtensions.includes(fileExtension)) {
        file.value = selectedFile;
      } else {
        toast.add({
          severity: "error",
          summary: "Invalid File Type",
          detail: "Please select a CSV or JSON file.",
          life: 3000
        });
      }
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedCollection.value || !file.value) {
      toast.add({
        severity: "error",
        summary: "Missing Data",
        detail: "Please select a collection and a file to upload.",
        life: 3000
      });
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file.value);
  
    const endpoint = `http://localhost:8000/upload/${selectedCollection.value.value}`;
  
    try {
      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      toast.add({
        severity: "success",
        summary: "Upload Successful",
        detail: response.data.message,
        life: 3000
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Upload Failed",
        detail: error.response.data.message,
        life: 3000
      });
    }
  };
  </script>
  
  <style scoped>
  /* Add any additional styling here */
  </style>  