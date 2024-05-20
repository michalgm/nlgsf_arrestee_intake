import "./App.css";

import * as React from "react";

import { Alert, AlertTitle } from "@material-ui/lab";
import {
  Backdrop,
  CircularProgress,
  Container,
  CssBaseline,
  Paper,
  Snackbar,
  Typography,
} from "@material-ui/core";
import FormRenderer, {
  componentTypes,
  validatorTypes,
} from "@data-driven-forms/react-form-renderer";
import {
  FormTemplate,
  componentMapper,
} from "@data-driven-forms/mui-component-mapper";
import {
  breakpoints,
  compose,
  palette,
  position,
  sizing,
  spacing,
} from "@material-ui/system";

import axios from "axios";
import moment from "moment";
import { styled } from "@material-ui/core/styles";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

const Box = styled("div")(
  breakpoints(compose(spacing, palette, sizing, position))
);

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
            message: `Invalid value for ${f.label || toTitleCase(f.name)}`,
          }
        : null,
    ].filter((v) => v),
  },
  ...f,
});

const urlParams = new URLSearchParams(window.location.search);

const defaultValues = urlParams.get("debug")
  ? {
      legal_first_name: "Fakey",
      legal_last_name: "MacFakePerson",
      preferred_name: "fake-o-phone",
      birth_date: "1/15/1983",
      phone_number: "123-234-1234",
      email: "john@doe.com",
      address: "123 Main St",
      city: "Oakland",
      state: "CA",
      zip: "94610",
      arrest_date: "5/30/2024",
      arrest_time: 1590976642,
      arrest_city: "Oakland",
      arrest_location: "10th and Broadway",
      charges: "123 Bad cops",
      felonies: false,
      prn: "12345678",
      docket: "AB-123456",
      court_date: "7/20/2024",
      court_time: 1590976642,
      abuse: "Ouch",
      notes: "Thank you",
    }
  : {
      arrest_date: "3/13/2024",
      arrest_city: "San Francisco",
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
  },
  { name: "phone_number" },
  {
    name: "email",
    type: "email",
    pattern: /^([a-z0-9_\-.]+)@([a-z0-9_\-.]+)\.([a-z]{2,5})$/i,
  },
  { name: "address", label: "Street Address" },
  { name: "city" },
  { name: "state" },
  { name: "zip" },
  {
    name: "special_needs",
    label:
      "Do you have any special needs/accessibility needs you would like us to know about?",
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
  },
  {
    name: "arrest_time",
    component: componentTypes.TIME_PICKER,
    // keyboard: true,
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
  },
  {
    name: "court_time",
    label: "Next Court Time",
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
    helperText:
      "If you have spoken with any lawyers about this arrest, please add their name",
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
    helperText:
      "Please do not describe anything you witnessed or did that could be incriminating to you or others",
  },
];

const schema = {
  fields: [
    {
      component: componentTypes.WIZARD,
      name: "wizard",
      stepsInfo: [
        { title: "Personal Information" },
        { title: "Arrest Information" },
        { title: "Court Information" },
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
        const token = await executeRecaptcha("submit");
        await axios.post("/submit", { data: values, token });
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
      if (k.match("_date")) {
        values[k] = moment(values[k], "MM/DD/YYYY").format("YYYY-MM-DD");
      } else if (k.match("_time")) {
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
        We will use the information you have provided to try to link people with
        movement lawyers and/or public defenders, to give you important legal
        information, and to try to make sure no one falls through the cracks.
        However, filling out this form does not guarantee you a lawyer. You are
        still responsible for going to your court date and keeping track of
        what's happening with your case. Thank you and we will be in touch soon.
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
          We will only use this information to keep track of people's cases,
          give you information, and coordinate legal defense. This information
          will not be shared or released.
        </Typography>
      </Alert>
      <FormRenderer
        schema={schema}
        componentMapper={componentMapper}
        FormTemplate={(props) => (
          <FormTemplate {...props} showFormControls={false} />
        )}
        onSubmit={submit}
        initialValues={defaultValues}
        validate={validate}
        showFormControls={false}
        onCancel={() => {}}
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
    </CssBaseline>
  );
}

export default App;
