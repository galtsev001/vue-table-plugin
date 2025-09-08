<template>
  <div
    class="filter-box"
    :style="{
      position: 'fixed',
      top: `${position.top}px`,
      left: `${position.left}px`,
      width: `${position.width}px`,
      zIndex: '9999',
    }"
    v-if="visible"
  >
    <div class="filter-content">
      <!-- Сортировка -->
      <ul class="filter-list">
        <li class="sort-item fw-bold" @click.stop="sortData(true)">
          <i class="bi bi-sort-alpha-down"></i> Сортировка от А до Я
        </li>
        <li class="sort-item fw-bold" @click.stop="sortData(false)">
          <i class="bi bi-sort-alpha-up-alt"></i> Сортировка от Я до А
        </li>
      </ul>

      <!-- Фильтрация -->
      <div class="filter-body">
        <input
          class="form-control mb-2"
          type="text"
          placeholder="Поиск"
          v-model="searchQuery"
          @input="handleSearchInput"
          ref="search_input"
        />

        <ul class="box">
          <li class="select-all">
            <input
              type="checkbox"
              v-model="allChecked"
              @change="toggleSelectAll"
            />
            <span class="mx-2 text-dark">(Выделить все)</span>
          </li>
          <li
            v-for="(item, index) in filteredColumns"
            :key="index"
            class="filter-item"
          >
            <input
              type="checkbox"
              :checked="isItemChecked(item)"
              @change="toggleItem(item)"
            />
            <span class="mx-2 text-dark">{{ item }}</span>
          </li>
        </ul>

        <div class="col-12 d-flex justify-content-between">
          <button class="btn btn-sm btn-success" @click="applyFilter">
            Применить
          </button>
          <button class="btn btn-sm btn-outline-success" @click="close">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject, watch, onMounted } from "vue";

export default {
  props: {
    position: {
      type: Object,
      required: true,
      default: () => ({ top: 0, left: 0, width: 200 }),
    },
    columnId: {
      type: String,
      required: true,
    },
  },
  emits: ["close"],
  setup(props, { emit }) {
    const visible = ref(false);
    const searchQuery = ref("");
    const allChecked = ref(false);
    const checkedItems = ref([]);
    const originalData = inject("data");
    const links = inject("links");
    const updateData = inject("updateData");
    const search_input = ref(null);

    const allItems = computed(() => {
      return filteredColumns.value;
    });

    // Метод для выделения/снятия всех элементов
    const toggleSelectAll = () => {
      if (allChecked.value) {
        // Выделяем все элементы
        checkedItems.value = [...allItems.value];
      } else {
        // Снимаем выделение
        checkedItems.value = [];
      }
    };

    const getSelectedItems = () => {
      return checkedItems.value;
    };

    // Проверка, выбран ли конкретный элемент
    const isItemChecked = (item) => {
      return checkedItems.value.includes(item);
    };

    // Переключение состояния элемента
    const toggleItem = (item) => {
      const index = checkedItems.value.indexOf(item);
      if (index === -1) {
        checkedItems.value.push(item);
      } else {
        checkedItems.value.splice(index, 1);
      }
      // Обновляем состояние "Выделить все"
      allChecked.value =
        checkedItems.value.length === filteredColumns.value.length;
    };

    // Обработчик поиска
    const handleSearchInput = () => {
      allChecked.value = false;
    };

    // Проверка, нужно ли показывать выпадающий список
    const shouldShowSelect = () => {
      return links.value?.some((link) => link.link_column === props.columnId);
    };

    // Получение опций для связанных таблиц
    const selectOptions = () => {
      const link = links.value?.find(
        (link) => link.link_column === props.columnId
      );
      if (!link) return [];

      let options = Object.values(link.value);

      if (searchQuery.value.length > 0) {
        const query = searchQuery.value.toLowerCase();
        options = options.filter((value) =>
          String(value).toLowerCase().includes(query)
        );
      }
      options = options.sort((a, b) => 
        String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }));
      return [...new Set(options)];
    };

    // Сортировка данных
    const sortData = (isAscending) => {
      const sortedData = [...originalData.value];
      sortedData.sort((a, b) => {
        const valA = a[props.columnId]?.toString().toLowerCase() || "";
        const valB = b[props.columnId]?.toString().toLowerCase() || "";
        return isAscending
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });
      updateData(sortedData, true);
    };

    // Фильтрация колонок
    const filteredColumns = computed(() => {
      if (shouldShowSelect()) {
        return selectOptions();
      } else {
        let items = originalData.value
          .map((x) => x[props.columnId])
          .filter((item) => item !== undefined && item !== null);

        if (searchQuery.value.length > 0) {
          const query = searchQuery.value.toLowerCase();
          items = items.filter((item) =>
            String(item).toLowerCase().includes(query)
          );
        }

        return [...new Set(items)];
      }
    });

    // Применение фильтра
    const applyFilter = () => {
      if (!originalData.value || !Array.isArray(originalData.value)) {
        close();
        return;
      }
      const selectedItems = getSelectedItems();
      let filteredData = [...originalData.value];

      if (selectedItems.length > 0) {
        if (shouldShowSelect()) {
          const link = links.value.find(
            (l) => l.link_column === props.columnId
          );
          if (link) {
            // Создаем Set выбранных ключей для оптимального поиска
            const selectedKeys = new Set(
              Object.entries(link.value)
                .filter(([, value]) => selectedItems.includes(value))
                .map(([key]) => key)
            );

            filteredData = filteredData.filter((item) =>
              selectedKeys.has(String(item[props.columnId]))
            );
          }
        } else {
          // Для обычных колонок фильтруем напрямую по значениям
          filteredData = filteredData.filter((item) =>
            selectedItems.includes(item[props.columnId])
          );
        }
      }      
      updateData(filteredData, true);
      close();

      return selectedItems;
    };

    // Закрытие фильтра
    const close = () => {
      visible.value = false;
      emit("close");
    };

    // Автофокус на поле ввода при открытии
    onMounted(() => {
      visible.value = true;
      setTimeout(() => {
        if (search_input.value) search_input.value.focus();
      }, 50);
    });

    // Следим за изменением отфильтрованных колонок
    watch(filteredColumns, () => {
      allChecked.value = false;
      checkedItems.value = [];
    });

    return {
      visible,
      searchQuery,
      allChecked,
      checkedItems,
      filteredColumns,
      toggleSelectAll,
      isItemChecked,
      toggleItem,
      handleSearchInput,
      sortData,
      applyFilter,
      close,
      search_input,
    };
  },
};
</script>

<style scoped>
.filter-box {
  background: white;
  border-radius: 4px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease-out;
}

.filter-content {
  padding: 10px;
  color: #000;
}

.filter-list {
  padding: 0;
  margin: 0;
  list-style: none;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.sort-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-item:hover {
  background-color: #f8f9fa;
  color: #198754;
}

.sort-item i {
  margin-right: 8px;
}

.filter-body {
  display: block;
}

.box {
  max-height: 200px;
  overflow-y: auto;
  margin: 8px 0;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 4px 0;
  list-style: none;
}

.select-all {
  padding: 6px 8px;
  background-color: #f8f9fa;
  font-weight: 500;
  border-bottom: 1px solid #dee2e6;
}

.filter-item {
  padding: 6px 8px;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.filter-item:hover {
  background-color: #f8f9fa;
}

.filter-item input[type="checkbox"] {
  margin-right: 8px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>