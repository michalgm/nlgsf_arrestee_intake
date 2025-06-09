import "./App.css";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import * as React from "react";

import Wizard from "@data-driven-forms/common/wizard";
import { FormTemplate, componentMapper } from "@data-driven-forms/mui-component-mapper";
import WizardNav from "@data-driven-forms/mui-component-mapper/wizard/wizard-nav";
import { FormRenderer, componentTypes, validatorTypes } from "@data-driven-forms/react-form-renderer";
import {
  Alert,
  AlertTitle,
  Backdrop,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import { breakpoints, compose, palette, position, sizing, spacing } from "@mui/system";

import selectNext from "@data-driven-forms/common/wizard/select-next";
import WizardContext from "@data-driven-forms/react-form-renderer/wizard-context";
import { styled } from "@mui/material/styles";
import { Stack } from "@mui/system";
import axios from "axios";
import moment from "moment";
import { useContext } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

const Box = styled("div")(breakpoints(compose(spacing, palette, sizing, position)));

const WizardInternal = ({ stepsInfo, StepperProps }) => {
  const { formOptions, currentStep, handlePrev, handleNext, activeStepIndex } = useContext(WizardContext);
  const handleNextClick = () => {
    currentStep.fields.forEach((field) => {
      formOptions.blur(field.name);
    });
    if (formOptions.getState().valid) {
      handleNext(selectNext(currentStep.nextStep, formOptions.getState));
    }
  };
  return (
    <div style={{ width: "100%" }}>
      {currentStep.title}
      {stepsInfo && <WizardNav StepperProps={StepperProps} stepsInfo={stepsInfo} activeStepIndex={activeStepIndex} />}

      {formOptions.renderForm(currentStep.fields)}
      <div>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="end">
          <Button variant="outlined" onClick={handlePrev} disabled={activeStepIndex === 0}>
            {" "}
            Back{" "}
          </Button>
          {currentStep.nextStep && (
            <Button variant="contained" onClick={handleNextClick}>
              {" "}
              Next{" "}
            </Button>
          )}
          {!currentStep.nextStep && (
            <Button
              variant="contained"
              // disabled={!formOptions.getState().valid}

              onClick={() => {
                currentStep.fields.forEach((field) => {
                  formOptions.blur(field.name);
                });
                if (formOptions.getState().valid) {
                  formOptions.handleSubmit();
                }
              }}
            >
              Submit
            </Button>
          )}
        </Stack>
      </div>
    </div>
  );
};
const WrappedWizard = (props) => <Wizard Wizard={WizardInternal} {...props} />;

function toTitleCase(str) {
  return str
    .split(/[ _]/)
    .map((w) => w[0].toUpperCase() + w.substr(1).toLowerCase())
    .join(" ");
}

const fieldDefaults = (f) => ({
  ...{
    component: componentTypes.TEXT_FIELD,
    label: toTitleCase(f.name),
    initialValue: "",
    margin: "normal",
    validate: [
      f.isRequired ? { type: validatorTypes.REQUIRED } : null,
      f.pattern
        ? {
            type: validatorTypes.PATTERN,
            pattern: f.pattern,
            message: f.message || `Invalid value for ${f.label || toTitleCase(f.name)}`,
          }
        : null,
      f.component === componentTypes.DATE_PICKER
        ? {
            type: "dateValidator",
            date_options: f.date_options,
          }
        : null,
      f.component === componentTypes.TIME_PICKER
        ? {
            type: "timeValidator",
          }
        : null,
    ].filter((v) => v),
  },
  ...f,
});

const urlParams = new URLSearchParams(window.location.search);

const validatorMapper = {
  // Custom validator for birth_date field
  dateValidator:
    ({ date_options: { minDate = "01/01/1920", maxDate = "12/31/2050" } = {} }) =>
    (value) => {
      if (!value) {
        return undefined;
      }
      const now = moment();
      const date = moment.isMoment(value) ? value : moment(value, "MM/DD/YYYY", true);

      if (!date.isValid()) {
        return "Invalid date format. Please use MM/DD/YYYY.";
      }
      if (minDate !== -1 && date.isBefore(minDate === "now" ? now : moment(minDate, "MM/DD/YYYY"))) {
        return minDate === "now" ? "Date cannot be in the past" : `Date must be after ${minDate}.`;
      }
      if (maxDate !== -1 && date.isAfter(maxDate === "now" ? now : moment(maxDate, "MM/DD/YYYY"))) {
        return maxDate === "now" ? "Date cannot be in the future" : `Date must be before ${maxDate}.`;
      }

      return undefined;
    },
  timeValidator: () => (value) => {
    if (!value) {
      return undefined;
    }
    const time = moment.isMoment(value) ? value : moment(value, true);
    if (!time.isValid()) {
      return "Invalid time. Please use HH:MM AM/PM format.";
    }
    return undefined;
  },
};

const defaultValues = urlParams.get("debug")
  ? {
      legal_first_name: "Fakey",
      legal_last_name: "MacFakePerson",
      preferred_name: "fake-o-phone",
      birth_date: "01/15/1983",
      phone_number: "123-234-1234",
      email: "john@doe.com",
      address: "123 Main St",
      city: "Oakland",
      state: "CA",
      zip: "94610",
      arrest_date: "05/30/2024",
      arrest_time: 1590976642,
      arrest_city: "Oakland",
      arrest_location: "10th and Broadway",
      charges: "123 Bad cops",
      felonies: false,
      prn: "12345678",
      docket: "AB-123456",
      court_date: "07/20/2024",
      court_time: 1590976642,
      abuse: "Ouch",
      notes: "Thank you",
    }
  : {
      // arrest_date: "3/13/2024",
      // arrest_city: "San Francisco",
    };

const personal_fields = [
  { name: "legal_first_name", isRequired: true },
  { name: "legal_last_name", isRequired: true },
  { name: "preferred_name" },
  {
    name: "legal_name_confidential",
    label: "Should we keep your legal name confidential?",
    component: componentTypes.CHECKBOX,
  },
  { name: "preferred_pronouns" },
  {
    name: "birth_date",
    component: componentTypes.DATE_PICKER,
    closeOnDaySelect: true,
    DatePickerProps: {
      openTo: "year",
      format: "MM/DD/YYYY",
      // mask: (value) =>
      //   value ? [/\d/, /\d/, "/", /\d/, /\d/, "/", /\d/, /\d/, /\d/, /\d/] : [],
      animateYearScrolling: false,
    },
    isRequired: true,
    date_options: {
      maxDate: "now",
    },
  },
  { name: "phone_number" },
  {
    name: "email",
    type: "email",
    pattern: /^([a-z0-9_\-.]+)@([a-z0-9_\-.]+)\.([a-z]{2,5})$/i,
    message: "Invalid email address",
  },
  { name: "address", label: "Street Address" },
  { name: "city" },
  { name: "state" },
  { name: "zip" },
  {
    name: "special_needs",
    label: "Do you have any special needs/accessibility needs you would like us to know about?",
    component: componentTypes.TEXTAREA,
    minRows: 4,
  },
];

const arrest_fields = [
  {
    name: "arrest_date",
    component: componentTypes.DATE_PICKER,
    DatePickerProps: {
      // keyboard: true,
      format: "MM/DD/YYYY",
      // mask: (value) =>
      //   value ? [/\d/, /\d/, "/", /\d/, /\d/, "/", /\d/, /\d/, /\d/, /\d/] : [],
      animateYearScrolling: false,
    },
    isRequired: true,
    date_options: {
      minDate: "01/01/2020",
      maxDate: "now",
    },
  },
  {
    name: "arrest_time",
    component: componentTypes.TIME_PICKER,
    MuiPickersUtilsProviderProps: {
      format: "hh:mm A",
    },
    isRequired: true,

    // mask: (value) =>
    //   value ? [/\d/, /\d/, ":", /\d/, /\d/, " ", /a|p/i, "M"] : [],
  },
  {
    name: "arrest_city",
    component: componentTypes.SELECT,
    options: [
      "Oakland",
      "San Francisco",
      "Berkeley",
      "Emeryville",
      "Dublin",
      "Hayward",
      "Richmond",
      "San Jose",
      "San Leandro",
      "San Mateo",
      "Santa Cruz",
      "Walnut Creek",
      "Other",
    ].map((value) => ({ value, label: value })),
    helperText: "(For the purposes of this form, SFO is in San Francisco)",
    isRequired: true,
    isSearchable: true,
    autoComplete: true,
    autoSelect: true,
    isClearable: true,
    autoHighlight: true,
    isOptionEqualToValue: (option, value) => option.value === (value?.value || value),
  },
  { name: "arrest_location" },
  {
    name: "charges",
    component: componentTypes.TEXTAREA,
    minRows: 4,
    isRequired: true,
  },
  {
    name: "felonies",
    label: "Felony Charges?",
    component: componentTypes.CHECKBOX,
  },
  {
    name: "abuse",
    label: "Jail Conditions/Police Misconduct",
    component: componentTypes.TEXTAREA,
    minRows: 4,
  },
];

const court_fields = [
  { name: "prn", label: "Incident ID/Police Report Number" },
  { name: "docket", label: "Docket/Citation/CEN Number" },
  {
    name: "court_date",
    label: "Next Court Date",
    component: componentTypes.DATE_PICKER,
    DatePickerProps: {
      // keyboard: true,
      format: "MM/DD/YYYY",
      // mask: (value) =>
      //   value ? [/\d/, /\d/, "/", /\d/, /\d/, "/", /\d/, /\d/, /\d/, /\d/] : [],
      animateYearScrolling: false,
    },
    isRequired: true,
    date_options: {
      minDate: "01/01/2020",
    },
  },
  {
    name: "court_time",
    label: "Next Court Time",
    // isRequired: true,
    component: componentTypes.TIME_PICKER,
    MuiPickersUtilsProviderProps: {
      format: "hh:mm A",
    },
  },
  {
    name: "court_location",
  },
  {
    name: "lawyer_name",
    helperText: "If you have spoken with any lawyers about this arrest, please add their name",
  },
  {
    name: "lawyer_contact_info",
    component: componentTypes.TEXTAREA,
    minRows: 4,
    condition: {
      when: "lawyer_name",
      isNotEmpty: true,
    },
  },
  {
    name: "notes",
    label: "Other Info",
    component: componentTypes.TEXTAREA,
    minRows: 4,
    helperText: "Please do not describe anything you witnessed or did that could be incriminating to you or others",
  },
];

const schema = {
  fields: [
    {
      component: componentTypes.WIZARD,
      name: "wizard",
      stepsInfo: [
        { title: "Personal Information", name: "personal_info" },
        { title: "Arrest Information", name: "arrest_info" },
        { title: "Court Information", name: "court_info" },
        // { title: 'Submit' }
      ],
      fields: [
        {
          name: "personal_info",
          fields: personal_fields.map(fieldDefaults),
          nextStep: "arrest_info",
        },
        {
          name: "arrest_info",
          fields: arrest_fields.map(fieldDefaults),
          nextStep: "court_info",
        },
        {
          name: "court_info",
          fields: court_fields.map(fieldDefaults),
        },

        // {
        //   name: 'disclaimer',
        //   fields: [{
        //     component: componentTypes.PLAIN_TEXT,
        //     name: 'disclaimer',
        //     label: `The responsibility to attend court dates and track your case as it winds through the criminal justice system ultimately rests with YOU (not your lawyer, friend, parent, or the NLG). It is your reputation, arrest record and liberty that is at stake and no one will ever have the same level of interest as you should. Think of those who are assisting you as partners in YOUR struggle for justice and your case as something that you simply cannot abdicate responsibility for, even when formally represented by an attorney. This is very important and failing to remain vigilant may cause you serious unintended consequences. This remains true whether you hire private counsel or an NLG lawyer, or get a public defender assigned to you and it is especially true if you decide to go solo (pro per) and represent yourself.\n         Also, please be advised that filling out this form does not guarantee representation by any lawyer nor does it relieve you of the important responsibilities stated above. Again, to ensure the best possible outcome, YOU need to keep yourself appraised of what is happening in your own case. This means knowing where you are in the proceedings (demurrer, pre-trial etc.), having a general sense of how you expect it to be resolved (through a jury trial or by pleading to an offense as a result of a deal with the District Attorney) and knowing WHEN the decision about a resolution will have to be made. You may lose a legal motion and have to decide on a resolution fairly quickly, so don't be caught off guard.Of course, it is always best to proceed represented by counsel. We will use this information to try to link people with progressive lawyers. Thank you. `
        //   }]
        // }
      ],
    },
  ],
};

const validate = (values) => {
  const errors = {};
  if (!values.email && !values.phone_number) {
    errors.email = "Please provide either email or phone number";
    errors.phone_number = "Please provide either email or phone number";
  }
  return errors;
};

const Form = () => {
  const [error, setError] = React.useState();
  const [submitCount, setSubmitCount] = React.useState(0);
  const [success, setSuccess] = React.useState(false);
  const [values, setValues] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  React.useEffect(() => {
    const getToken = async () => {
      try {
        setLoading(true);
        if (!urlParams.get("nosubmit")) {
          const token = await executeRecaptcha("submit");
          await axios.post("/submit", { data: values, token });
        }
        setSuccess(true);
      } catch (e) {
        console.error(e);
        if (e && e.response && e.response.data && e.response.data.error) {
          setError(JSON.stringify(e.response.data.error));
        } else {
          setError(e && e.message ? e.message : e);
        }
      }
      setLoading(false);
    };
    if (values) {
      getToken();
    }
  }, [values, submitCount, executeRecaptcha]);

  const submit = async (values, api) => {
    setError(null);
    setSuccess(false);

    api.getRegisteredFields().forEach((f) => {
      if (values[f] === undefined) {
        values[f] = "";
      }
    });
    Object.keys(values).forEach((k) => {
      if (k.match("_date") && values[k]) {
        values[k] = moment(values[k], "MM/DD/YYYY").format("YYYY-MM-DD");
      } else if (k.match("_time") && values[k]) {
        values[k] = moment(values[k]).format("hh:mm A");
      }
    });
    setValues(values);
    setSubmitCount(submitCount + 1);
  };
  if (success) {
    return (
      <Alert severity="success">
        <AlertTitle>Thank you for submitting your information!</AlertTitle>
        We will use the information you have provided to try to link people with movement lawyers and/or public
        defenders, to give you important legal information, and to try to make sure no one falls through the cracks.
        However, filling out this form does not guarantee you a lawyer. You are still responsible for going to your
        court date and keeping track of what's happening with your case. Thank you and we will be in touch soon.
      </Alert>
    );
  }

  return (
    <>
      <Backdrop style={{ zIndex: 1000 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Snackbar
        open={Boolean(error)}
        onClose={() => {
          setError(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={() => {
            setError(null);
          }}
        >
          <AlertTitle>An error occured while submitting the form:</AlertTitle>
          {error}
        </Alert>
      </Snackbar>
      <Alert severity="info" icon={false}>
        <Typography variant="subtitle1">
          We will only use this information to keep track of people's cases, give you information, and coordinate legal
          defense. This information will not be shared or released.
        </Typography>
        <Typography variant="subtitle1">
          (If you have any issues with the captcha and are on a VPN, please try connecting to a different VPN server or
          temporarily disabling your VPN.)
        </Typography>
      </Alert>
      <FormRenderer
        // debug={(state) => console.log(state)}
        schema={schema}
        componentMapper={{ ...componentMapper, wizard: WrappedWizard }}
        // componentMapper={componentMapper}
        FormTemplate={(props) => <FormTemplate {...props} showFormControls={false} />}
        onSubmit={submit}
        initialValues={defaultValues}
        validate={validate}
        showFormControls={false}
        onCancel={() => {}}
        validatorMapper={validatorMapper}
      />
    </>
  );
};

function App() {
  return (
    <CssBaseline>
      {/* <Box
        id="nlg-logo"
        xs={{ width: 70, position: "absolute" }}
        lg={{ width: 140, position: "fixed" }}
      >
        <a href="https://nlgsf.org">
          <img
            src="/NLGSF-GREEN-LOGO@2x.png"
            alt="NLG-SFBA logo in green"
            loading="lazy"
          />
        </a>
      </Box> */}
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Container maxWidth="md">
          <Paper style={{ padding: 20 }}>
            <Box bgcolor="primary.main" color="white" padding={2} mb={4}>
              <Typography variant="h4" align="center">
                Legal Solidarity Bay Area Arrestee Form
              </Typography>
            </Box>
            {Form()}
          </Paper>
        </Container>
      </LocalizationProvider>
    </CssBaseline>
  );
}

export default App;
