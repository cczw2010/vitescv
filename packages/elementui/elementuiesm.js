// elementui vitejs在利用ElementUiResolver自动加载组件模块，而前端异步路由加载的时候总是出问题，可能异步的时候不能很好的处理嵌套依赖的ui组件的commonjs，这里自己做一下转化
import ElLoading from "element-ui/lib/loading.js"
import ElPagination from "element-ui/lib/pagination.js"
import ElDialog from "element-ui/lib/dialog.js"
import ElAutocomplete from "element-ui/lib/autocomplete.js"
import ElDropdown from "element-ui/lib/dropdown.js"
import ElDropdownMenu from "element-ui/lib/dropdown-menu.js"
import ElDropdownItem from "element-ui/lib/dropdown-item.js"
import ElMenu from "element-ui/lib/menu.js"
import ElSubmenu from "element-ui/lib/submenu.js"
import ElMenuItem from "element-ui/lib/menu-item.js"
import ElMenuItemGroup from "element-ui/lib/menu-item-group.js"
import ElInput from "element-ui/lib/input.js"
import ElInputNumber from "element-ui/lib/input-number.js"
import ElRadio from "element-ui/lib/radio.js"
import ElRadioGroup from "element-ui/lib/radio-group.js"
import ElRadioButton from "element-ui/lib/radio-button.js"
import ElCheckbox from "element-ui/lib/checkbox.js"
import ElCheckboxButton from "element-ui/lib/checkbox-button.js"
import ElCheckboxGroup from "element-ui/lib/checkbox-group.js"
import ElSwitch from "element-ui/lib/switch.js"
import ElSelect from "element-ui/lib/select.js"
import ElOption from "element-ui/lib/option.js"
import ElOptionGroup from "element-ui/lib/option-group.js"
import ElButton from "element-ui/lib/button.js"
import ElButtonGroup from "element-ui/lib/button-group.js"
import ElTable from "element-ui/lib/table.js"
import ElTableColumn from "element-ui/lib/table-column.js"
import ElDatePicker from "element-ui/lib/date-picker.js"
import ElTimeSelect from "element-ui/lib/time-select.js"
import ElTimePicker from "element-ui/lib/time-picker.js"
import ElPopover from "element-ui/lib/popover.js"
import ElTooltip from "element-ui/lib/tooltip.js"
import ElMessageBox from "element-ui/lib/message-box.js"
import ElBreadcrumb from "element-ui/lib/breadcrumb.js"
import ElBreadcrumbItem from "element-ui/lib/breadcrumb-item.js"
import ElForm from "element-ui/lib/form.js"
import ElFormItem from "element-ui/lib/form-item.js"
import ElTabs from "element-ui/lib/tabs.js"
import ElTabPane from "element-ui/lib/tab-pane.js"
import ElTag from "element-ui/lib/tag.js"
import ElTree from "element-ui/lib/tree.js"
import ElAlert from "element-ui/lib/alert.js"
import ElNotification from "element-ui/lib/notification.js"
import ElSlider from "element-ui/lib/slider.js"
import ElIcon from "element-ui/lib/icon.js"
import ElRow from "element-ui/lib/row.js"
import ElCol from "element-ui/lib/col.js"
import ElUpload from "element-ui/lib/upload.js"
import ElProgress from "element-ui/lib/progress.js"
import ElSpinner from "element-ui/lib/spinner.js"
import ElMessage from "element-ui/lib/message.js"
import ElBadge from "element-ui/lib/badge.js"
import ElCard from "element-ui/lib/card.js"
import ElRate from "element-ui/lib/rate.js"
import ElSteps from "element-ui/lib/steps.js"
import ElStep from "element-ui/lib/step.js"
import ElCarousel from "element-ui/lib/carousel.js"
import ElScrollbar from "element-ui/lib/scrollbar.js"
import ElCarouselItem from "element-ui/lib/carousel-item.js"
import ElCollapse from "element-ui/lib/collapse.js"
import ElCollapseItem from "element-ui/lib/collapse-item.js"
import ElCascader from "element-ui/lib/cascader.js"
import ElColorPicker from "element-ui/lib/color-picker.js"
import ElTransfer from "element-ui/lib/transfer.js"
import ElContainer from "element-ui/lib/container.js"
import ElHeader from "element-ui/lib/header.js"
import ElAside from "element-ui/lib/aside.js"
import ElMain from "element-ui/lib/main.js"
import ElFooter from "element-ui/lib/footer.js"
import ElTimeline from "element-ui/lib/timeline.js"
import ElTimelineItem from "element-ui/lib/timeline-item.js"
import ElLink from "element-ui/lib/link.js"
import ElDivider from "element-ui/lib/divider.js"
import ElImage from "element-ui/lib/image.js"
import ElCalendar from "element-ui/lib/calendar.js"
import ElBacktop from "element-ui/lib/backtop.js"
import ElInfiniteScroll from "element-ui/lib/infinite-scroll.js"
import ElPageHeader from "element-ui/lib/page-header.js"
import ElCascaderPanel from "element-ui/lib/cascader-panel.js"
import ElAvatar from "element-ui/lib/avatar.js"
import ElDrawer from "element-ui/lib/drawer.js"
import ElStatistic from "element-ui/lib/statistic.js"
import ElPopconfirm from "element-ui/lib/popconfirm.js"
import ElSkeleton from "element-ui/lib/skeleton.js"
import ElSkeletonItem from "element-ui/lib/skeleton-item.js"
import ElEmpty from "element-ui/lib/empty.js"
import ElDescriptions from "element-ui/lib/descriptions.js"
import ElDescriptionsItem from "element-ui/lib/descriptions-item.js"
import ElResult from "element-ui/lib/result.js"

export {
  ElLoading,
  ElPagination,
  ElDialog,
  ElAutocomplete,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElMenu,
  ElSubmenu,
  ElMenuItem,
  ElMenuItemGroup,
  ElInput,
  ElInputNumber,
  ElRadio,
  ElRadioGroup,
  ElRadioButton,
  ElCheckbox,
  ElCheckboxButton,
  ElCheckboxGroup,
  ElSwitch,
  ElSelect,
  ElOption,
  ElOptionGroup,
  ElButton,
  ElButtonGroup,
  ElTable,
  ElTableColumn,
  ElDatePicker,
  ElTimeSelect,
  ElTimePicker,
  ElPopover,
  ElTooltip,
  ElMessageBox,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElForm,
  ElFormItem,
  ElTabs,
  ElTabPane,
  ElTag,
  ElTree,
  ElAlert,
  ElNotification,
  ElSlider,
  ElIcon,
  ElRow,
  ElCol,
  ElUpload,
  ElProgress,
  ElSpinner,
  ElMessage,
  ElBadge,
  ElCard,
  ElRate,
  ElSteps,
  ElStep,
  ElCarousel,
  ElScrollbar,
  ElCarouselItem,
  ElCollapse,
  ElCollapseItem,
  ElCascader,
  ElColorPicker,
  ElTransfer,
  ElContainer,
  ElHeader,
  ElAside,
  ElMain,
  ElFooter,
  ElTimeline,
  ElTimelineItem,
  ElLink,
  ElDivider,
  ElImage,
  ElCalendar,
  ElBacktop,
  ElInfiniteScroll,
  ElPageHeader,
  ElCascaderPanel,
  ElAvatar,
  ElDrawer,
  ElStatistic,
  ElPopconfirm,
  ElSkeleton,
  ElSkeletonItem,
  ElEmpty,
  ElDescriptions,
  ElDescriptionsItem,
  ElResult
}