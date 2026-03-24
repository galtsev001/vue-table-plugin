import TableApp from './components/table/TableApp.vue'
import ButtonTable from './components/table/ButtonTable.vue'
import HeaderTable from './components/table/HeaderTable.vue'
import FilterTable from './components/table/FilterTable.vue'
import BodyTable from './components/table/BodyTable.vue'
import RowTable from './components/table/RowTable.vue'
import CellTable from './components/table/CellTable.vue'

const VueTablePlugin = {
  install(app, options) {
    // Регистрируем компоненты глобально
    app.component('VueTable', TableApp)
    app.component('VueTableButton', ButtonTable)
    app.component('VueTableHeader', HeaderTable)
    app.component('VueTableFilter', FilterTable)
    app.component('VueTableBody', BodyTable)
    app.component('VueTableRow', RowTable)
    app.component('VueTableCell', CellTable)

    // Можно добавить глобальные настройки
    if (options) {
      app.config.globalProperties.$vueTableOptions = options
    }
  }
}

// Экспорт для использования в качестве модуля
export {
  TableApp as VueTable,
  ButtonTable as VueTableButton,
  HeaderTable as VueTableHeader,
  FilterTable as VueTableFilter,
  BodyTable as VueTableBody,
  RowTable as VueTableRow,
  CellTable as VueTableCell
}

export default VueTablePlugin
