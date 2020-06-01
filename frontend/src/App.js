import * as React from 'react';
import { Container, Typography, Paper, CssBaseline, Snackbar } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import FormRenderer, { componentTypes } from '@data-driven-forms/react-form-renderer';
import { componentMapper, FormTemplate } from '@data-driven-forms/mui-component-mapper';
import axios from 'axios';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import './App.css';

function toTitleCase(str) {
  return str.split(/[ _]/)
    .map(w => w[0].toUpperCase() + w.substr(1).toLowerCase())
    .join(' ')
}

const fieldDefaults = f => ({
  ...{
    component: componentTypes.TEXT_FIELD,
    label: toTitleCase(f.name),
    initialValue: '',
    margin: "normal"
  }, ...f
})

const urlParams = new URLSearchParams(window.location.search);


const defaultValues = urlParams.get('debug') ?
  {
    "first_name": "John",
    "last_name": "Doe",
    "dob": "1/15/1983",
    "phone_number": "123-234-1234",
    "email": "john@doe.com",
    "address": "123 Main St",
    "city": "Oakland",
    "state": "CA",
    "zip": "94610",
    "arrest_date": "5/30/2020",
    "arrest_time": 1590976642,
    "arrest_city": "Oakland",
    "arrest_location": "10th and Broadway",
    "charges": "123 Bad cops",
    "felonies": false,
    "prn": "12345678",
    "docket": "AB-123456",
    "court_date": "7/20/2020",
    "courttime": "9:00 AM - Wiley Courthouse",
    "abuse": "Ouch",
    "notes": "Thank you"
  } : {}

const personal_fields = [
  { name: 'first_name' },
  { name: 'last_name' },
  {
    name: 'dob', label: 'Date of Birth', component: componentTypes.DATE_PICKER, closeOnDaySelect: true, DatePickerProps: {
      keyboard: true,
      openTo: "year",
      format: 'MM/DD/YYYY',
      mask: value => value ? [/\d/, /\d/, "/", /\d/, /\d/, "/", /\d/, /\d/, /\d/, /\d/] : [],
      animateYearScrolling: false
    },
  },
  { name: 'phone_number' },
  { name: 'email', type: 'email' },
  { name: 'address', label: 'Street Address' },
  { name: 'city' },
  { name: 'state' },
  { name: 'zip' },
]

const arrest_fields = [
  {
    name: 'arrest_date', component: componentTypes.DATE_PICKER, DatePickerProps: {
      keyboard: true,
      format: 'MM/DD/YYYY',
      mask: value => value ? [/\d/, /\d/, "/", /\d/, /\d/, "/", /\d/, /\d/, /\d/, /\d/] : [],
      animateYearScrolling: false
    },
  },
  {
    name: 'arrest_time', component: componentTypes.TIME_PICKER, keyboard: true,
    MuiPickersUtilsProviderProps: {
      format: 'hh:mm A',

    },
    mask: value => value ? [/\d/, /\d/, ":", /\d/, /\d/, " ", /a|p/i, "M"] : []
  },
  { name: 'arrest_city', component: componentTypes.SELECT, options: ['Oakland', 'San Francisco', 'Emeryville', 'Berkeley'].map(value => ({ value, label: value })) },
  { name: 'arrest_location' },
  { name: 'charges', component: componentTypes.TEXTAREA, rows: 4 },
  { name: 'felonies', label: 'Felony Charges?', component: componentTypes.CHECKBOX },
  { name: 'prn', label: 'Incident ID/Police Report Number' },
  { name: 'docket', label: 'Docket/Citation/CEN Number' },
  {
    name: 'court_date', label: 'Next Court Date', component: componentTypes.DATE_PICKER, DatePickerProps: {
      keyboard: true,
      format: 'MM/DD/YYYY',
      mask: value => value ? [/\d/, /\d/, "/", /\d/, /\d/, "/", /\d/, /\d/, /\d/, /\d/] : [],
      animateYearScrolling: false
    },
  },
  {
    name: 'courttime', label: 'Next Court Date Time and Location (Department)'
  },
  { name: 'abuse', label: 'Jail Conditions/Police Misconduct', component: componentTypes.TEXTAREA, rows: 4 },
  { name: 'notes', label: 'Other Info', component: componentTypes.TEXTAREA, rows: 4 },
]

const schema = {
  fields: [
    {
      component: componentTypes.SUB_FORM,
      title: 'Personal Information',
      name: 'personal_info',
      fields: personal_fields.map(fieldDefaults)
    },
    {
      component: componentTypes.SUB_FORM,
      title: 'Arrest Information',
      name: 'arrest_info',
      fields: arrest_fields.map(fieldDefaults)
    },
    {
      component: componentTypes.PLAIN_TEXT,
      name: 'disclaimer',
      label: `The responsibility to attend court dates and track your case as it winds through the criminal justice system ultimately rests with YOU (not your lawyer, friend, parent, or the NLG). It is your reputation, arrest record and liberty that is at stake and no one will ever have the same level of interest as you should. Think of those who are assisting you as partners in YOUR struggle for justice and your case as something that you simply cannot abdicate responsibility for, even when formally represented by an attorney. This is very important and failing to remain vigilant may cause you serious unintended consequences. This remains true whether you hire private counsel or an NLG lawyer, or get a public defender assigned to you and it is especially true if you decide to go solo (pro per) and represent yourself.\n         Also, please be advised that filling out this form does not guarantee representation by any lawyer nor does it relieve you of the important responsibilities stated above. Again, to ensure the best possible outcome, YOU need to keep yourself appraised of what is happening in your own case. This means knowing where you are in the proceedings (demurrer, pre-trial etc.), having a general sense of how you expect it to be resolved (through a jury trial or by pleading to an offense as a result of a deal with the District Attorney) and knowing WHEN the decision about a resolution will have to be made. You may lose a legal motion and have to decide on a resolution fairly quickly, so don't be caught off guard.Of course, it is always best to proceed represented by counsel. We will use this information to try to link people with progressive lawyers. Thank you. `
    }
  ],
}

const Form = () => {
  const [error, setError] = React.useState();
  const [submitCount, setSubmitCount] = React.useState(0);
  const [success, setSuccess] = React.useState(false);
  const [values, setValues] = React.useState('');
  const { executeRecaptcha } = useGoogleReCaptcha();

  React.useEffect(() => {
    const getToken = async () => {
      try {
        const token = await executeRecaptcha("submit");
        await axios.post('/submit', { data: values, token })
        setSuccess(true)
      } catch (e) {
        if (e.response && e.response.data && e.response.data.error) {
          setError(e.response.data.error)
        } else {
          setError(e.message || e)
        }
      }

    }
    if (values) {
      getToken()
    }
  }, [values, submitCount, executeRecaptcha])

  const submit = async (values, api) => {
    setError(null);
    setSuccess(false);
    api.getRegisteredFields().forEach(f => {
      if (values[f] === undefined) {
        values[f] = ''
      }
    })
    Object.keys(values).forEach(k => {
      if (typeof values[k] === 'object') {
        values[k] = values[k].format(k.match('time') ? 'hh:mm A' : 'MM/DD/YYYY');
      }
    })
    console.log(values, submitCount)
    setValues(values)
    setSubmitCount(submitCount + 1)
  }
  if (success) {
    return <Alert severity="success">
      Thank you for submitting your information!
    </Alert>
  }

  return (<>
    <Snackbar open={Boolean(error)} onClose={() => { setError(null) }} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Alert severity="error" onClose={() => { setError(null) }}>
        <AlertTitle>An error occured while submitting the form:</AlertTitle>
        {error}
      </Alert>
    </Snackbar>
    <Alert severity="info" icon={false}>
      <Typography variant="subtitle1">
        We will only use this information to track people's cases, distribute information, and facilitate legal defense. This information will not be shared or released.
          </Typography>
    </Alert>
    <FormRenderer
      schema={schema}
      componentMapper={componentMapper}
      FormTemplate={FormTemplate}
      onSubmit={submit}
      initialValues={defaultValues}
    />
  </>
  )
}

function App() {
  return (
    <CssBaseline>
      <Container maxWidth="md">
        <Paper style={{ padding: 20 }}>
          <Typography variant="h3" gutterBottom>NLG SF Arrestee Intake Form</Typography>
          {Form()}
        </Paper>
      </Container>
    </CssBaseline>
  );
}

export default App;
