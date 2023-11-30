const template = `
<div class="rs_dialog_holder">
  <div class="rs_dialog">
    <div class="rs_dialog_content">
      <h1>{{=repeat}} <a href="javascript:void(0)" title="{{=cancel}}" alt="{{=cancel}}"></a> </h1>
      <p class="frequency-select-wrapper">
        <label for="rs_frequency">{{=frequency}}:</label>
        <select data-wrapper-class="ui-recurring-select" id="rs_frequency" class="rs_frequency" name="rs_frequency">
          <option value="Daily">{{=daily}}</option>
          <option value="Weekly">{{=weekly}}</option>
          <option value="Monthly">{{=monthly}}</option>
          <option value="Yearly">{{=yearly}}</option>
        </select>
      </p>

      <div class="daily_options freq_option_section">
        <p>
          {{=every}}
          <input type="text" data-wrapper-class="ui-recurring-select" name="rs_daily_interval" class="rs_daily_interval rs_interval" value="1" size="2" />
          {{=days}}
        </p>
      </div>
      <div class="weekly_options freq_option_section">
        <p>
          {{=every}}
          <input type="text" data-wrapper-class="ui-recurring-select" name="rs_weekly_interval" class="rs_weekly_interval rs_interval" value="1" size="2" />
          {{=weeks_on}}:
        </p>
        <div class="day_holder">
          {{@weekdays}}
            <a href="#" data-value="{{=_val.value}}">{{=_val.label}}</a>
          {{/@weekdays}}
        </div>
        <span style="clear:both; visibility:hidden; height:1px;">.</span>
      </div>
      <div class="monthly_options freq_option_section">
        <p>
          {{=every}}
          <input type="text" data-wrapper-class="ui-recurring-select" name="rs_monthly_interval" class="rs_monthly_interval rs_interval" value="1" size="2" />
          {{=months}}:
        </p>
        <p class="monthly_rule_type">
          <span><label for="monthly_rule_type_day">{{=day_of_month}}</label><input type="radio" class="monthly_rule_type_day" name="monthly_rule_type" id="monthly_rule_type_day" value="true" /></span>
          <span><label for="monthly_rule_type_week">{{=day_of_week}}</label><input type="radio" class="monthly_rule_type_week" name="monthly_rule_type" id="monthly_rule_type_week" value="true" /></span>
        </p>
        <p class="rs_calendar_day"></p>
        <p class="rs_calendar_week"></p>
      </div>
      <div class="yearly_options freq_option_section">
        <p>
          {{=every}}
          <input type="text" data-wrapper-class="ui-recurring-select" name="rs_yearly_interval" class="rs_yearly_interval rs_interval" value="1" size="2" />
          {{=years}}
        </p>
      </div>
      <p class="rs_summary">
        <span></span>
      </p>
      <div class="controls">
        <input type="button" data-wrapper-class="ui-recurring-select" class="rs_save" value="{{=ok}}" />
        <input type="button" data-wrapper-class="ui-recurring-select" class="rs_cancel" value="{{=cancel}}" />
      </div>
    </div>
  </div>
</div>
`
