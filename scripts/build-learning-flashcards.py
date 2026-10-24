"""Build folded A4 learning cards from the app's exact shared content export.

Usage: python scripts/build-learning-flashcards.py INPUT.json OUTPUT.pdf
Each sheet has two cut-out strips, with question left and answer right.
Fold at the middle: no duplex alignment or guessed reverse-page order needed.
"""
from pathlib import Path
import sys,json,math,hashlib
from html import escape
from collections import defaultdict
from io import BytesIO
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor,Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

ROOT=Path(__file__).resolve().parents[1]
PINE=HexColor('#173a2b');GOLD=HexColor('#967734');INK=HexColor('#222a23');MUTED=HexColor('#526257')
PAPER=HexColor('#fcfaf3');LINE=HexColor('#c4cdbd')
FONTS=Path(r'C:\Windows\Fonts')
pdfmetrics.registerFont(TTFont('JL',str(FONTS/'segoeui.ttf')))
pdfmetrics.registerFont(TTFont('JL-Bold',str(FONTS/'segoeuib.ttf')))
pdfmetrics.registerFontFamily('JL',normal='JL',bold='JL-Bold',italic='JL',boldItalic='JL-Bold')
W,H=A4

def para(c,value,x,top,width,size=11,bold=False,color=INK,max_height=600):
    style=ParagraphStyle('text',fontName='JL-Bold' if bold else 'JL',fontSize=size,leading=size*1.35,textColor=color,spaceAfter=0,alignment=TA_LEFT,splitLongWords=True)
    text=escape(str(value)).replace('\n','<br/>')
    p=Paragraph(text,style);_,height=p.wrap(width,max_height)
    if height>max_height+.1:raise ValueError(f'Text does not fit: {str(value)[:90]} ({height:.1f}/{max_height:.1f})')
    p.drawOn(c,x,top-height);return top-height

def url_block(c,url,label,x,y,width,size=8.5):
    before=y;y=para(c,label,x,y,width,size,color=PINE,max_height=60)
    c.linkURL(url,(x,y,x+width,before),relative=0,thickness=0)
    return y

def qrcode(c,url,x,y,size=14*mm):
    code=qr.QrCodeWidget(url);bx,by,bw,bh=code.getBounds();d=Drawing(size,size,transform=[size/(bw-bx),0,0,size/(bh-by),0,0]);d.add(code);renderPDF.draw(d,c,x,y)
    c.linkURL(url,(x,y,x+size,y+size),relative=0,thickness=0)

def select_cards(cards):
    photos=[card for card in cards if card.get('image')][:6]
    groups=defaultdict(list)
    for card in cards:
        if not card.get('image'):groups[card['categoryId']].append(card)
    chosen=[]
    while len(chosen)<30 and any(groups.values()):
        for key in groups:
            if groups[key] and len(chosen)<30:chosen.append(groups[key].pop(0))
    return photos+chosen

def front(c,card,x,y,w,h,num):
    pad=7*mm;left=x+pad;right=w-2*pad;top=y+h-pad
    top=para(c,card['categoryTitle'].upper(),left,top,right,8.5,True,GOLD,30)-5*mm
    if card.get('context'):
        top=para(c,card['context'],left,top,right,8,color=MUTED,max_height=38)-3*mm
    top=para(c,card['question'],left,top,right,13,True,PINE,120)-6*mm
    image=card.get('image')
    if image:
        src=ROOT/'public'/image['src'].lstrip('/')
        with Image.open(src) as original:
            im=original.convert('RGB');im.thumbnail((1000,1000));buf=BytesIO();im.save(buf,'JPEG',quality=87);buf.seek(0)
            from reportlab.lib.utils import ImageReader
            maxh=min(66*mm,top-(y+35*mm));ratio=min(right/im.width,maxh/im.height)
            iw,ih=im.width*ratio,im.height*ratio
            c.drawImage(ImageReader(buf),left+(right-iw)/2,top-ih,iw,ih)
        top-=ih+3*mm
        credit=f"{image.get('author','')} | {image.get('license','')}"
        para(c,credit,left,top,right,7,color=MUTED,max_height=40)
    qrcode(c,'https://jagdlatein.de'+card['learningHref'],left,y+8*mm,20*mm)
    para(c,'In der App vertiefen\nErst selbst antworten, dann aufdecken.',left+24*mm,y+23*mm,right-24*mm,8,color=MUTED,max_height=45)
    c.setFont('JL',7);c.setFillColor(MUTED);c.drawRightString(x+w-pad,y+3.5*mm,f'JAGDLATEIN | Karte {num:02}')

def back(c,card,x,y,w,h,num,source_ids):
    pad=7*mm;left=x+pad;right=w-2*pad;top=y+h-pad
    top=para(c,'ANTWORT',left,top,right,8.5,True,GOLD,30)-4*mm
    # Keep large answers readable while allowing a long scenario answer to wrap.
    top=para(c,card['answer'],left,top,right,12,True,PINE,112)-4*mm
    explanation=card.get('explanation','')
    if explanation and explanation!=card['answer']:
        top=para(c,explanation,left,top,right,10.2,max_height=144)-4*mm
    ids=[source_ids[source['url']] for source in card.get('sources',[]) if source.get('url')]
    suffix=f"Quellen: {', '.join(str(v) for v in ids)}. Vollständige Links im Quellenverzeichnis."
    top=para(c,suffix,left,top,right,8,color=MUTED,max_height=45)-3*mm
    if card.get('reviewedOn'):
        date_label='Bildnachweis geprüft: ' if card.get('sourceScope')=='photo' else 'Übernommener Prüfstand: '
        top=para(c,date_label+card['reviewedOn'],left,top,right,7.5,color=MUTED,max_height=35)-2*mm
    para(c,'Eigene Einschätzung:  [ ] Noch einmal   [ ] Gewusst',left,y+13*mm,right,8,color=MUTED,max_height=30)
    c.setFont('JL',7);c.drawRightString(x+w-pad,y+3.5*mm,f'{num:02} | JAGDLATEIN')
    assert top>y+16*mm,(card['id'],'answer overflows',top-y)

def header(c,title,page):
    c.setFillColor(PINE);c.setFont('JL-Bold',10);c.drawString(14*mm,H-14*mm,'JAGDLATEIN | '+title)
    c.setFont('JL',8);c.setFillColor(MUTED);c.drawRightString(W-14*mm,12*mm,str(page))

def main():
    raw=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    cards=select_cards(raw if isinstance(raw,list) else raw.get('cards',raw.get('flashcards',[])))
    assert len(cards)>=24 and len(set(card['id'] for card in cards))==len(cards)
    out=Path(sys.argv[2]);out.parent.mkdir(parents=True,exist_ok=True)
    sources={}
    for card in cards:
        for item in card.get('sources',[]):
            if item.get('url') and item['url'] not in sources:sources[item['url']]=item.get('label',item.get('title',item['url']))
        image=card.get('image')
        if image:
            for url,label in [(image.get('creditUrl'),f"Bild: {image.get('author')}"),(image.get('licenseUrl'),image.get('license'))]:
                if url and url not in sources:sources[url]=label
    source_ids={url:i+1 for i,url in enumerate(sources)}
    c=canvas.Canvas(str(out),pagesize=A4,pageCompression=1)
    c.setTitle('Jagdlatein Lernkarten - Wildwissen verstehen und wiederholen');c.setAuthor('Jagdlatein');c.setSubject('Frage, Antwort, Erklaerung und Quellen; Faltdruck auf A4')
    page=1;header(c,'Lernkarten zum Falten',page)
    y=H-36*mm
    y=para(c,'Dein Wissen.\nAuch auf Papier.',14*mm,y,W-28*mm,29,True,PINE,120)-9*mm
    y=para(c,f'{len(cards)} Karten aus den bestehenden Jagdlatein-Inhalten: echte Wildfotos und Fragen aus verschiedenen Kategorien.',14*mm,y,W-28*mm,13,max_height=70)-8*mm
    for step in ['1. A4, Hochformat, tatsächliche Größe / 100 Prozent drucken. Einseitiger Druck reicht.', '2. Entlang der äußeren Schnittlinien ausschneiden. An der gestrichelten Mitte falten: Frage vorn, Antwort hinten. Rückseiten zusammenkleben, wenn du feste Karten möchtest.', '3. Vor dem Umdrehen selbst antworten. Unsichere Karten getrennt sammeln und später erneut abfragen.', '4. Der QR-Code führt zur passenden vorhandenen Lektion oder zum Artenporträt in der App. Für geschützte Inhalte ist dein aktiver Jagdlatein-Zugang erforderlich.']:
        y=para(c,step,14*mm,y,W-28*mm,11,max_height=90)-6*mm
    y-=4*mm
    y=para(c,'Stand und Quellen',14*mm,y,W-28*mm,14,True,PINE,35)-4*mm
    y=para(c,'Die Antworttexte und Erklärungen wurden aus den vorhandenen Kursen übernommen. Ihr ursprünglicher Inhaltsstand bleibt auf der Karte erhalten. Die Zusammenstellung ist keine erneute fachliche Gesamtprüfung der App. Rechtskarten sind in diesem Starterpaket nicht enthalten.',14*mm,y,W-28*mm,10.5,max_height=90)-6*mm
    y=para(c,'Fotos: Luc Viatour / lucnix.be, © Giles Laurent / gileslaurent.com, © Superbass / Wikimedia Commons, Johann-Nikolaus Andreae und Martin Mecnarowski / photomecan.eu. Originalquellen und Lizenzen stehen im Quellenverzeichnis. Bearbeitung dieser PDF-Fassung: CC BY-SA 4.0. Die Original-Lizenzen bleiben erhalten. Fotos wurden unverzerrt verkleinert und neu angeordnet.',14*mm,y,W-28*mm,9,max_height=95)-3*mm
    url_block(c,'https://creativecommons.org/licenses/by-sa/4.0/','creativecommons.org/licenses/by-sa/4.0/',14*mm,y,W-28*mm,9)
    c.showPage();page+=1
    for start in range(0,len(cards),2):
        header(c,'Frage links - Antwort rechts',page)
        x=14*mm;w=W-28*mm;h=124*mm
        for row,card in enumerate(cards[start:start+2]):
            y=H-27*mm-h-row*(h+7*mm)
            c.setStrokeColor(LINE);c.setLineWidth(.6);c.rect(x,y,w,h)
            c.setDash(4,4);c.line(x+w/2,y,x+w/2,y+h);c.setDash()
            front(c,card,x,y,w/2,h,start+row+1)
            back(c,card,x+w/2,y,w/2,h,start+row+1,source_ids)
        c.showPage();page+=1
    header(c,'Quellenverzeichnis',page);y=H-29*mm
    for url,label in sources.items():
        needed=65 if len(url)>120 else 55
        if y<25*mm+needed:
            c.showPage();page+=1;header(c,'Quellenverzeichnis',page);y=H-29*mm
        y=para(c,f'{source_ids[url]}. {label}',14*mm,y,W-28*mm,9.5,True,max_height=45)-2*mm
        y=url_block(c,url,url,14*mm,y,W-28*mm,8)-5*mm
    c.save()
    manifest={'cards':len(cards),'cardIds':[card['id'] for card in cards],'pages':page,'sources':len(sources),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'photoCards':sum(bool(card.get('image')) for card in cards)}
    out.with_suffix('.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(manifest,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
