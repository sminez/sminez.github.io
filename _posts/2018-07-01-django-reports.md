---
title: Writing A CSV Reports Page With Django (part 1)
published: true
comments: true
categories: python tutorial django
---

![final](/assets/django-reports/final-page.png)

This is the first of a three part series on implementing a lightweight CSV
report generation page for Django. In this post we will look at the framework
itself and how it works. In subsequent posts we'll go through a couple of
example reports and how to extend the functionality to make use of Excel
template files and some simple data visualisation.


## The HTML

Ignoring any custom data visualisation in the browser (which will of course
require its own HTML) we can get away with writing two short Django templates
for our reports page: the page itself and a report _card_ that we will use to
summarise the individual reports and provide the form components we need to
accept user input. Everything is done with the base Django template system and
Bootstrap.

First we'll take a look at the cards:
```html
<!-- report_card.html -->
{% raw %}{% comment %}
A single report form along with its descriptive information.
{% endcomment %}
<div class="card border-dark">
  <div class="card-body">
    <h5 class="card-title">{{ form.title }}</h5>
    <hr>

    <p class="card-text">
      {% autoescape off %}
        {{ form.summary }}
      {% endautoescape %}
    </p>
    <p class="card-text"><small class="text-muted">
      {% autoescape off %}
        {{ form.notes }}
      {% endautoescape %}
    </small></p>

    <form method="post">
      {% csrf_token %}
      <input type="hidden" name="key" value="{{ form.key }}">
      {{ form.as_p }}
    </div>

    <div class="card-footer">
      <button class="btn btn-primary" type="submit">{{ form.button_text|default:"Download" }}</button>
    </div>
  </form>
</div>{% endraw %}
```

As you can see, it's nothing too fancy: we are injecting a form (which we'll
look at later) that has a couple of text properties on it that we use to display
the details of the report and we're optionally setting a custom name for the
form submission button. The Django `autoescape` tag allows us to include raw
HTML markup in the summary and notes fields of our report form rather than being
restricted to plain text. Each report gets its own card which are then bundled up
into decks for rendering into the main page:
```html
<!-- reports.html -->
{% raw %}{% extends "base.html" %}
{% block title %}Reports{% endblock %}

{% block content %}
<div class="jumbotron-fluid">
  <div class="col-md-12">
    <h2>Generate A Report</h2>
    <br>
    <p>The following reports are currently available:</p>
    <hr>

    {# Each report is rendered as a stand-alone form on its own card #}
    {% for deck in decks %}
      <div class="card-deck">
        {% for card in deck %}
          {% autoescape off %}
            {{ card }}
          {% endautoescape %}
        {% endfor %}
      </div>
      <br>
    {% endfor %}

  </div>
</div>
{% endblock %}{% endraw %}
```

Again, this should be pretty easy to understand: cards are grouped into decks,
each deck is rendered in a row. That's it!


## The View

Now for the Django view that handles generating the page:

```python
def generate_report(request):
    '''API endpoint for generating a report.'''
    if request.method == 'POST':
        # Generate the report and serve the CSV
        try:
            return REGISTRY.run_report(request)
        except ReportError:
            messages.error(
                request,
                "Oh dear...something went wrong in generating the report."
            )

    decks = REGISTRY.get_decks(request)

    return render(request, 'my-app/reports.html', {'decks': decks})
```

Nothing exciting here other than the fact that we introduce...


## The REGISTRY

This is the heart of mini report generation framework. Let's take a look at how
it works:

```python
class ReportError(Exception):
    pass


class ReportRegistry:
    '''
    Top level registry for report handlers that allows us to coordinate the
    population of the report page and handle the various form submissions
    being returned.
    '''
    _reports = OrderedDict()  # Ensure consistent ordering of reports

    def register(self, report_form):
        '''Decorator to add a new report to the registry.'''
        key = report_form.key

        if self._reports.get(key) is not None:
            raise ValueError('Duplicate report key: {}'.format(key))

        self._reports[key] = report_form
        return report_form

    def run_report(self, request):
        '''Run the requested report and return the response'''
        form_class = self._reports[request.POST['key']]
        form = form_class(request.POST)

        if form.is_valid():
            response = form.run_report(request)
            if response:
                return response

        raise ReportError()

    def get_decks(self, request):
        '''
        For each registered report, fill out the HTML template to create the
        deck of Bootstrap card elements that we need for rendering the report
        page.
        '''
        cards = []
        report_card = get_template('my-app/fragments/report_card.html')
        for report in self._reports.values():
            card = report_card.template.render(
                RequestContext(request, {'form': report})
            )
            cards.append(card)

        # Iterate over the cards in groups of three to fill out the UI. If
        # len(cards) % 3 != 0 then we pad the last deck with some empty
        # placeholder cards to balance the page.
        it = iter(cards)
        decks = list(zip_longest(
            *[it for _ in range(3)],
            fillvalue='<div class="card border-dark"></div>'
        ))

        return decks


REGISTRY = ReportRegistry()
```

In order to create a new report, we simply create a new subclass of `ReportForm`
and decorate it with `REGISTRY.register`, ensuring that we provide the required
properties and methods on the form:

```python
class ReportForm(forms.Form):
    '''
    A base class for creating Report forms that generate CSV download responses.
    '''
    key = None
    title = None
    summary = None
    notes = None
    fields = []

    def run_report(self, request):
        '''Report generation logic goes here'''
        raise NotImplementedError()

    @staticmethod
    def write_csv_response(fname, columns, data):
        '''
        This is a generic handler that you should use for each of your
        reports if possible, overriding for report specific logic if needed.
        '''
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="{}"'.format(fname)

        # Write the CSV to the response
        w = csv.DictWriter(response, columns)
        w.writeheader()

        for row in data:
            w.writerow(row)

        return response    


@REGISTRY.register
class MyReport(ReportForm):
    '''An example Report Form class'''

    # Override defaults from ReportForm
    key = 'my-report'
    title = 'My Example Report'
    summary = 'A mock report class for demonstration purposes.'
    notes = 'A real report class would have more functionality than this!'
    columns = ['foo', 'bar', 'baz']

    # Custom form elements go here.
    start = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}))
    end = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}))

    def run_report(self, request):
        '''Parse out the form values and use them to fetch the data we need'''
        start = self.cleaned_data['start']
        end = self.cleaned_data['end']

        fname = 'my_awesome_report-{}_to_{}.csv'.format(start, end)

        # Get the data we need from the database.
        # `get_data` should return a list of dictionaries that map columns to values.
        data = get_data(start, end)

        return self.write_csv_response(fname, self.columns, data)
```


And that's it! Your report cards will be rendered in the order they are defined
in your `reports.py` file and the form action on each card will trigger the
generation and return of your CSV data. Next time we'll take a look at how to
format the data from your database in order to generate the CSV and work through
how to create a more complex report class.
