<template>
  <td>
    <select
      v-if="shouldShowSelect"
      class="form-control"
      v-model="selectedValue"
      @change="handleChange"
    >
      <option
        v-for="([key, value]) in sortedOptions"
        :selected="isChecked(key, cell)"
        :key="key"
        :value="key"
      >
        {{ value }}
      </option>
    </select>
    <input
      v-else
      ref="inputRef"
      class="form-control expand-on-focus"
      :type="getTypeCell(id)"
      :value="cell"
      @input="handleChange"
    />
  </td>
</template>

<script>
import { inject, computed, ref, watch } from "vue";
import moment from "moment";

export default {
  props: ["cell", "id", "rowId"],
  setup(props) {
    const links = inject("links");
    const settings = inject("settings");
    const handleRowChange = inject("handleRowChange");
    const handleNewRow = inject("handleNewRow");
    const originalData = inject("originalData");
    const data = inject("data");
    const selectedValue = ref(props.cell);
    const inputRef = ref(null);

    const getValue = (value) => {
      const type = getTypeCell(props.id);

      if (type === "int") {
        return Number(value);
      } else if (type === "datetime-local") {
        return moment(value).format("YYYY-MM-DDTHH:mm:ss");
      } else {
        return value.toString();
      }
    };

    const handleChange = (event) => {
      const newValue = getValue(event.target.value);
      const columnId = props.id;
      const rowId = props.rowId;

      if (originalData.value) {
        const rowIndex = originalData.value.findIndex(
          (row) => row.id === rowId
        );
        if (rowIndex !== -1) {
          const updatedData = [...originalData.value];
          updatedData[rowIndex][columnId] = newValue;
          originalData.value = updatedData;
        }
      }

      if (rowId) {
        const maxId =
          data.value && data.value.length > 0
            ? Math.max(...data.value.map((x) => x.id || 0), 0)
            : 0;
        const maxIdOriginal =
          originalData.value && originalData.value.length > 0
            ? Math.max(...originalData.value.map((x) => x.id || 0), 0)
            : 0;

        if (rowId > maxId || rowId > maxIdOriginal) {
          handleNewRow(rowId);
        } else {
          handleRowChange(rowId);
        }
      }
    };

    watch(
      () => props.cell,
      (newVal) => {
        selectedValue.value = newVal;
      }
    );

    const shouldShowSelect = computed(() => {
      return links.value?.some((link) => link.link_column === props.id) ?? false;
    });

    const sortedOptions = computed(() => {
      const link = links.value?.find((link) => link.link_column === props.id);

      if (!link || !link.value) return [];
      
      // Преобразуем объект в массив [key, value] и сортируем
      return Object.entries(link.value).sort(([, valueA], [, valueB]) => {
        const firstLetterA = String(valueA).trim().charAt(0).toLowerCase();
        const firstLetterB = String(valueB).trim().charAt(0).toLowerCase();
        return firstLetterA.localeCompare(firstLetterB, 'ru');
      });
    });

    const isChecked = (index, checked) => {
      return +index === +checked;
    };

    const getTypeCell = (fields) => {
      const type = settings.value.find(
        (x) => x.name_column_db === fields
      )?.type_data;
      if (type === "int") {
        return "int";
      } else if (type === "DateTime") {
        return "datetime-local";
      } else {
        return "text";
      }
    };

    return {
      handleChange,
      isChecked,
      getTypeCell,
      shouldShowSelect,
      sortedOptions, // изменили название
      selectedValue,
      inputRef,
    };
  },
};
</script>

<style scoped>
td {
  padding: 0 !important;
  border: 1px solid #ccc;
}

.form-control {
  width: 100%;
  padding: 8px;
  background: transparent;
  border-radius: 0;
}

.form-control:focus {
  outline: none;
  border-color: green;
}

select.form-control {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
</style>