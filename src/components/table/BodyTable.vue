<template>
  <tbody>
    <Row v-for="(row, index) in sortedRows" :key="index" :row="row" />
  </tbody>
</template>

<script>
import RowTable from "./RowTable.vue";
import { inject, computed, toRaw } from "vue";

export default {
  setup() {
    const data = inject("originalData");
    const settings = inject("settings");

    // Сортируем поля из settings по column_order
    const sortedFields = computed(() => {
      if (!settings?.value) return [];
      const rawSettings = toRaw(settings.value);
      return [...rawSettings]
        .sort((a, b) => a.column_order - b.column_order)
        .map(field => field.name_column_db);
    });

    // Создаём отсортированные строки
    const sortedRows = computed(() => {
      if (!Array.isArray(data?.value)) return [];
      
      return data.value.map(row => {
        const sortedRow = {};
        // Добавляем свойства в порядке sortedFields
        sortedFields.value.forEach(field => {
          if (Object.hasOwn(row, field)) {
            sortedRow[field] = row[field];
          }
        });
        return sortedRow;
      });
    });

    return {
      sortedRows,
    };
  },
  components: {
    Row: RowTable,
  },
};
</script>

<style scoped>
.scroller {
  height: 500px;
  overflow-y: auto;
}
</style>