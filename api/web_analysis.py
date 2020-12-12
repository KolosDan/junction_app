from bs4 import BeautifulSoup, Comment, Doctype, Declaration, CData, NavigableString
import re
from summa import keywords
from nltk.stem import WordNetLemmatizer
import pandas as pd
from nltk.corpus import stopwords
from nltk.tag import pos_tag

depression_corpus = ['crying', 'hurt', 'sad', 'pain', 'emotional',
     'tears', 'cry', 'cried', 'tear',
     'sad', 'hate', 'sick', 'lonely', 'hurts', 
     'upset', 'annoyed',
     'confused', 'pissed', 'aid',
     'nerves', 'fever', 'pain',
     'headache', 'sick',
     'hurting',
     'meds', 'oppressed',
     'sad', 'unhappy', 'hopeless', 
     'discouraged', 'worthless', 'guilt', 'shame', 'critisizing', 'blaming', 
     'difficult', 'loneliness', 'loss', 'insomnia', 'avoiding', 'dissatisfied', 
     'worrying', 'worried', 'suicidal',
     'failure', 'failed', 'guilty', 'punished', 'killing', 'annoyed', 'tired', 'lost']

#URL Classification DB
df = pd.read_csv('final_classified.csv').drop(columns=['Unnamed: 0'])

def clean_html(html):
    soup = BeautifulSoup(html, 'lxml')

    [s.extract() for s in soup('script')]
    [s.extract() for s in soup('style')]
    [s.extract() for s in soup.find_all(string=lambda text: isinstance(text, Comment))]
    [s.extract() for s in soup.find_all(string=lambda text: isinstance(text, Doctype))]
    [s.extract() for s in soup.find_all(string=lambda text: isinstance(text, Declaration))]
    [s.extract() for s in soup.find_all(string=lambda text: isinstance(text, CData))]


    clean = ''

    for i in soup.children:
        if isinstance(i, NavigableString):
            clean += str(i)
        elif isinstance(i, Doctype):
            pass
        elif isinstance(i, Comment):
            pass
        else:
            clean += i.text
        
        clean += ' '

    return re.sub(r'\s+', ' ', clean)

def classify_page(url):
    domain = url.split('/')[2]
    # print(domain)
    resp = df[df['url'] == domain]
    
    if len(resp) != 0:
        website_class = list(resp['name'])[0]
    else:
        resp = df[df['url'] == '.'.join(domain.split('.')[-2:])]

        if len(resp) != 0:
            website_class = list(resp['name'])[0]
        else:
            website_class = 'unclassified'

    return website_class
    

def analyze_unclassified(data):
    lmtz = WordNetLemmatizer()
    url_class = classify_page(data['url'])

    clean_page = clean_html(data['html'])
    keyword_count = int(len(clean_page.split(' ')) * 0.01)
    if keyword_count == 0:
        keyword_count = 1

    if keyword_count > 5:
        keyword_count = 5

    keywords_from_page = []
    for i in keywords.keywords(clean_page, words=keyword_count).split('\n'):
        try:
            lemma = lmtz.lemmatize(i)
            if lemma not in keywords_from_page and lemma not in stopwords.words('english') and len(lemma) >= 3:
                keywords_from_page.append(lemma)
        except Exception as e:
            print(e)
    
    disorder_score = 0

    corpus = depression_corpus
    for i in corpus:
        if i in keywords_from_page:
            disorder_score += 2
            corpus.remove(i)

    for i in corpus:
        if ' %s ' % i in clean_page:
            disorder_score += 1


    return {'type': 'unclassified', 'data': {url_class: keywords_from_page}, 'timestamp': data['timestamp'], 'url': data['url'], 'disorder_score': disorder_score}
    

def analyze_search(data):
    lmtz = WordNetLemmatizer()
    
    clean_page = clean_html(data['next_html'])

    keyword_count = int(len(clean_page.split(' ')) * 0.05)
    
    if keyword_count == 0:
        keyword_count = 1

    if keyword_count > 5:
        keyword_count = 5

    keywords_from_page = []
    for i in keywords.keywords(clean_page, words=keyword_count).split('\n'):
        try:
            lemma = lmtz.lemmatize(i)
            if lemma not in keywords_from_page and lemma not in stopwords.words('english') and len(lemma) >= 3:
                keywords_from_page.append(lemma)
        except Exception as e:
            print(e)
    
        disorder_score = 0

    corpus = depression_corpus
    for i in corpus:
        if i in keywords_from_page:
            disorder_score += 2
            corpus.remove(i)

    for i in corpus:
        if i in clean_page:
            disorder_score += 1

    return {'type': 'search', 'data': { data['query']: keywords_from_page }, 'timestamp': data['timestamp'], 'url': data['next_url'], 'disorder_score': disorder_score}

def analyze_messages(data):
    return {'type': 'sn_message', 'data': data['message'], 'timestamp': data['timestamp'], 'url': data['url']}

def analyze_posts(data):
    return {'type': 'sn_feed', 'data': clean_html(data['post']), 'timestamp': data['timestamp'], 'url': data['url']}
