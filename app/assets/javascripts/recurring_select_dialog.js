//= require utils
//= require defaults
//= require t
//= require template

const defaultState = {
  interval: 1,
  until: null,
  count: null,
  validations: { day: [], day_of_month: [], day_of_week: {} }
}
const initialState = { ...defaultState, rule_type: "IceCube::DailyRule" }

class RecurringSelectDialog {
  constructor(recurring_selector) {
    this.config = this.constructor.config
    this.dialogTemplate = new t(template)
    this.cancel = this.cancel.bind(this);
    this.outerCancel = this.outerCancel.bind(this);
    this.save = this.save.bind(this);
    this.summaryUpdate = this.summaryUpdate.bind(this);
    this.summaryFetchSuccess = this.summaryFetchSuccess.bind(this);
    this.init_calendar_days = this.init_calendar_days.bind(this);
    this.init_calendar_weeks = this.init_calendar_weeks.bind(this);
    this.toggle_month_view = this.toggle_month_view.bind(this);
    this.freqChanged = this.freqChanged.bind(this);
    this.intervalChanged = this.intervalChanged.bind(this);
    this.daysChanged = this.daysChanged.bind(this);
    this.dateOfMonthChanged = this.dateOfMonthChanged.bind(this);
    this.weekOfMonthChanged = this.weekOfMonthChanged.bind(this);
    this.recurring_selector = recurring_selector;
    this.current_rule = this.recurring_selector.recurring_select('current_rule');

    this.initState(this.current_rule.hash)

    this.initDialogBox();
  }

  initState(state) {
    if (!isPlainObject(state)) {
      this.current_rule.hash = initialState
      return
    }

    const _state = state || initialState
    state.validations = { ...defaultState.validations, ..._state.validations }
    this.current_rule.hash = _state
  }

  initDialogBox() {
    document.querySelectorAll(".rs_dialog_holder").forEach(el => el.parentNode.removeChild(el))

    const uiPage = document.querySelector('.ui-page-active')
    const anchor = uiPage ? uiPage : document.body

    const div = document.createElement("div")
    div.innerHTML = this.template()
    anchor.appendChild(div.children[0])

    this.outer_holder = document.querySelector(".rs_dialog_holder");
    this.inner_holder = this.outer_holder.querySelector(".rs_dialog");
    this.content = this.outer_holder.querySelector(".rs_dialog_content");

    this.mainEventInit();
    this.summaryInit();
    this.freqInit();
    this.outer_holder.dispatchEvent(new CustomEvent("recurring_select:dialog_opened"))
    this.freq_select.focus();
  }

  cancel() {
    this.outer_holder.remove();
    this.recurring_selector.recurring_select('cancel');
  }

  outerCancel(event) {
    if (event.target.classList.contains("rs_dialog_holder")) {
      this.cancel();
    }
  }

  save() {
    if ((this.current_rule.str == null)) { return; }
    this.outer_holder.remove();
    this.recurring_selector.recurring_select('save', this.current_rule);
  }

// ========================= Init Methods ===============================

  mainEventInit() {
    // Tap hooks are for jQueryMobile
    on(this.outer_holder, 'click tap', this.outerCancel);
    on(this.content, 'click tap', 'h1 a', this.cancel);
    this.save_button = this.content.querySelector('input.rs_save')
    on(this.save_button, "click tap", this.save)
    on(this.content.querySelector('input.rs_cancel'), "click tap", this.cancel)
  }

  freqInit() {
    this.freq_select = this.outer_holder.querySelector(".rs_frequency")
    on(this.freq_select, "change", this.freqChanged)

    const rule_type = this.current_rule.hash.rule_type
    const types = [ "Daily", "Weekly", "Monthly", "Yearly" ]

    types.forEach((t, i) => {
      if (!rule_type || !rule_type.includes(t)) return

      this.freq_select.selectedIndex = i
      this[`init${t}Options`]();
    })
  }

  initDailyOptions() {
    const section = this.content.querySelector('.daily_options')
    section.style.display = "block"

    const interval_input = section.querySelector('.rs_daily_interval')
    interval_input.value = this.current_rule.hash.interval
    on(interval_input, "change keyup", this.intervalChanged);

    interval_input.dispatchEvent(new Event("keyup"))
  }

  initWeeklyOptions() {
    const section = this.content.querySelector('.weekly_options');
    section.style.display = "block"
    off(section, "click")
    on(section, "click", ".day_holder a", this.daysChanged)

    // connect the interval field
    const interval_input = section.querySelector('.rs_weekly_interval');
    interval_input.value = this.current_rule.hash.interval
    on(interval_input, "change keyup", this.intervalChanged);

    // clear selected days
    section.querySelectorAll(".day_holder a").forEach(el =>
      el.classList.remove("selected")
    )

    // connect the day fields
    if (this.current_rule.hash.validations.day) {
      Array.from(this.current_rule.hash.validations.day).forEach((val) =>
        section.querySelector(".day_holder a[data-value='"+val+"']").classList.add("selected")
      )
    }

  }

  initMonthlyOptions() {
    const section = this.content.querySelector('.monthly_options')
    section.style.display = "block"

    const interval_input = section.querySelector('.rs_monthly_interval')
    interval_input.value = this.current_rule.hash.interval
    on(interval_input, "change keyup", this.intervalChanged)

    this.init_calendar_days(section);
    this.init_calendar_weeks(section);

    const in_week_mode = Object.keys(this.current_rule.hash.validations.day_of_week).length > 0;
    section.querySelector(".monthly_rule_type_week").checked = in_week_mode
    section.querySelector(".monthly_rule_type_day").checked = !in_week_mode;
    this.toggle_month_view();

    on(section, "change", "input[name=monthly_rule_type]", this.toggle_month_view)
  }

  initYearlyOptions() {
    const section = this.content.querySelector('.yearly_options');
    section.style.display = 'block'

    const interval_input = section.querySelector('.rs_yearly_interval');
    interval_input.value = this.current_rule.hash.interval
    on(interval_input, "change keyup", this.intervalChanged)
  }


  summaryInit() {
    this.summary = this.outer_holder.querySelector(".rs_summary");
    this.summaryUpdate();
  }

// ========================= render methods ===============================

  summaryUpdate(new_string) {
    this.summaryFetch()
    if (this.current_rule.str) {
      let rule_str = this.current_rule.str.replace("*", "");
      this.showSummary(rule_str)
    } else {
    }
  }

  showSummary(text) {
    if (text.length < 20) {
      text = `${this.config.texts["summary"]}: ${text}`;
    }
    this.summary.querySelector("span").textContent = text
  }

  summaryFetch() {
    const url = `${i18nBaseUrl}/${this.config.texts["locale_iso_code"]}`
    const headers = { 'X-Requested-With' : 'XMLHttpRequest', 'Content-Type' : 'application/x-www-form-urlencoded' }
    const body = serialize(this.current_rule.hash)

    this.summary.classList.add("fetching");
    this.save_button.classList.add("disabled");
    this.showSummary("")

    fetch(url, { method: "POST", body, headers })
      .then(r => r.text())
      .then(this.summaryFetchSuccess)
      .finally(() => {
        this.summary.classList.remove("fetching")
        this.save_button.classList.remove("disabled")
      })
  }

  summaryFetchSuccess(data) {
    this.current_rule.str = data
    this.showSummary(data)
  }

  init_calendar_days(section) {
    const monthly_calendar = section.querySelector(".rs_calendar_day");
    monthly_calendar.innerHTML = "";
    for (let num = 1; num <= 31; num++) {
      const day_link = document.createElement("a")
      day_link.innerText = num
      monthly_calendar.appendChild(day_link)
      if (Array.from(this.current_rule.hash.validations.day_of_month).includes(num)) {
        day_link.classList.add("selected");
      }
    };

    // add last day of month button
    const end_of_month_link = document.createElement("a")
    end_of_month_link.innerText = this.config.texts["last_day"]
    monthly_calendar.appendChild(end_of_month_link);
    end_of_month_link.classList.add("end_of_month");
    if (Array.from(this.current_rule.hash.validations.day_of_month).includes(-1)) {
      end_of_month_link.classList.add("selected");
    }

    off(monthly_calendar, "click tap")
    on(monthly_calendar, "click tap", "a", this.dateOfMonthChanged)
  }

  init_calendar_weeks(section) {
    const monthly_calendar = section.querySelector(".rs_calendar_week")
    monthly_calendar.innerHTML = ""
    const row_labels = this.config.texts["order"];
    const show_row = this.config.options["monthly"]["show_week"];
    const cell_str = this.config.texts["days_first_letter"];

    const iterable = [1, 2, 3, 4, 5, -1]
    for (let index = 0; index < iterable.length; index++) {
      const num = iterable[index];
      if (show_row[index]) {
        const el = document.createElement("span")
        el.innerText = row_labels[index]
        monthly_calendar.appendChild(el);

        this.eachWeekday(day => {
          const day_link = document.createElement("a")
          day_link.innerText = cell_str[day]
          day_link.setAttribute("day", day);
          day_link.setAttribute("instance", num);
          monthly_calendar.appendChild(day_link);
        })
      }
    };

    Object.entries(this.current_rule.hash.validations.day_of_week).forEach(([key, value]) => {
      Array.from(value).forEach((instance, index) => {
        section.querySelector(`a[day='${key}'][instance='${instance}']`).classList.add("selected")
      })
    })

    off(monthly_calendar, "click tap")
    on(monthly_calendar, "click tap", "a", this.weekOfMonthChanged)
  }

  toggle_month_view() {
    const day_calendar = this.content.querySelector(".rs_calendar_day")
    const week_calendar = this.content.querySelector(".rs_calendar_week")
    const week_mode = this.content.querySelector(".monthly_rule_type_week").checked

    if (week_mode) {
      week_calendar.style.display = "block"
      day_calendar.style.display = "none"
      this.restoreWeekOfMonthState()
    } else {
      week_calendar.style.display = "none"
      day_calendar.style.display = "block"
      this.restoreDateOfMonthState()
    }
  }

// ========================= Change callbacks ===============================

  freqChanged() {
    this.resetState()

    this.content.querySelectorAll(".freq_option_section").forEach(el => el.style.display = 'none')
    this.content.querySelector("input[type=radio], input[type=checkbox]").checked = false

    const frequency = this.freq_select.value || "Daily"
    this.current_rule.hash.rule_type = `IceCube::${frequency}Rule`
    this.current_rule.str = this.config.texts[frequency.toLowerCase()]
    this[`init${frequency}Options`]()

    this.summaryUpdate();
  }

  intervalChanged(event) {
    this.resetState()
    this.current_rule.hash.interval = Math.max(1, parseInt(event.currentTarget.value))
    this.summaryUpdate();
  }

  daysChanged(event) {
    event.target.classList.toggle("selected");
    this.resetState()

    const raw_days = Array.from(this.content.querySelectorAll(".day_holder a.selected"))
      .map(el => parseInt(el.dataset.value))
    this.current_rule.hash.validations.day = raw_days
    this.summaryUpdate();
    return false;
  }

  dateOfMonthChanged(event) {
    event.target.classList.toggle("selected")
    this.restoreDateOfMonthState()

    return false
  }

  restoreDateOfMonthState() {
    const days = this.content.querySelectorAll(".monthly_options .rs_calendar_day a.selected")
    const state = Array.from(days).map(el => {
      return el.innerText === this.config.texts["last_day"] ? -1 : parseInt(el.innerText)
    })
    this.current_rule.hash.validations = { ...defaultState.validations, day_of_month: state }
    this.summaryUpdate()
  }

  weekOfMonthChanged(event) {
    event.target.classList.toggle("selected")
    this.restoreWeekOfMonthState()

    return false
  }

  restoreWeekOfMonthState() {
    const weekdays = this.content.querySelectorAll(".monthly_options .rs_calendar_week a.selected")
    const state = Array.from(weekdays).reduce((state, el) => {
        const day = parseInt(el.getAttribute("day"));
        const instance = parseInt(el.getAttribute("instance"));

        state[day] = state[day] || []
        state[day].includes(instance) || state[day].push(instance)

        return state
    }, {})
    this.current_rule.hash.validations = { ...defaultState.validations, day_of_week: state }
    this.summaryUpdate()
  }

  resetState() {
    const state = this.current_rule.hash
    const validations = { ...state.validations, ...defaultState.validations }
    this.current_rule.hash = { ...state, ...defaultState, week_start: this.config.texts["first_day_of_week"] }
    this.current_rule.hash.validations = validations
    this.current_rule.str = null
  }

// ========================= Change callbacks ===============================

  eachWeekday(cb) {
    for (let i = this.config.texts["first_day_of_week"], day_of_week = i, end = 7 + this.config.texts["first_day_of_week"], asc = this.config.texts["first_day_of_week"] <= end; asc ? i < end : i > end; asc ? i++ : i--, day_of_week = i) {
      cb(day_of_week % 7)
    }
  }

  template() {
    const weekdays = []

    this.eachWeekday(day => {
      weekdays.push({
        value: day,
        label: this.config.texts["days_first_letter"][day]
      })
    })

    return this.dialogTemplate.render({...this.config.texts, weekdays })
  }
}

RecurringSelectDialog.config = defaultConfig

window.RecurringSelectDialog = RecurringSelectDialog
