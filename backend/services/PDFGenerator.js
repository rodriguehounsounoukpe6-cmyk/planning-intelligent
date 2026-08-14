// ============================================
// SERVICE DE GENERATION PDF - VERSION PREMIUM
// ============================================
//
// Notes de conception :
// - Aucun emoji n'est utilise nulle part. PDFKit + Helvetica ne rend pas
//   les emojis correctement (carres / caracteres casses a l'impression).
//   A la place : des icones vectorielles dessinees a la main (livre,
//   horloge, etoile, coche...) et des badges textuels.
// - Bug corrige : 'Helvetica-Italic' n'existe pas comme police integree
//   de PDFKit -> remplace par 'Helvetica-Oblique'.
// - Design en 3 pages : couverture + stats, planning detaille,
//   recommandations. Degrades, cartes avec liseres, icones vectorielles.
// - AJOUT : Informations de l'eleve (Nom, Classe, Serie, Email) en en-tete.
//   Le mot de passe n'est pas inclus.
// ============================================

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ==========================================
// PALETTE DE COULEURS PREMIUM
// ==========================================
const COLORS = {
    primary: '#2C3E7A',
    primaryLight: '#E8EDF5',
    secondary: '#1A1A2E',
    accent: '#E94560',
    accentLight: '#FDE8EC',
    gold: '#F5C842',
    goldLight: '#FEF6DE',
    green: '#2ECC71',
    greenLight: '#E9FBF0',
    dark: '#1F2937',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
    border: '#E5E7EB'
};

const TYPE_META = {
    etude: { label: 'ETUDE', color: COLORS.green, fond: COLORS.greenLight },
    domestique: { label: 'DOMESTIQUE', color: COLORS.gold, fond: COLORS.goldLight },
    personnel: { label: 'PERSONNEL', color: COLORS.primary, fond: COLORS.primaryLight }
};

const PAGE_MARGIN = 50;

// ==========================================
// NETTOYAGE DU TEXTE (anti-caracteres bizarres)
// ==========================================
function nettoyerTexte(texte) {
    if (texte === null || texte === undefined) return '';
    return String(texte)
        .replace(/[\u{0080}-\u{FFFF}]/gu, (car) => (car.codePointAt(0) <= 0xFF ? car : ''))
        .replace(/[\u{10000}-\u{10FFFF}]/gu, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

class PDFGenerator {
    static genererPlanningPDF(utilisateur, plan, emplois, taches) {
        const outputDir = path.join(__dirname, '../pdfs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const filename = `planning_premium_${utilisateur.id}_${Date.now()}.pdf`;
        const filepath = path.join(outputDir, filename);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 40,
            info: {
                Title: 'Mon Planning Intelligent',
                Author: utilisateur.nom || 'Etudiant'
            },
            bufferPages: true
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        this._page1(doc, utilisateur, plan, emplois, taches);
        this._page2(doc, plan, emplois);
        this._page3(doc, utilisateur, plan, emplois, taches);
        this._footer(doc);

        doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                resolve({
                    success: true,
                    filename: filename,
                    path: filepath,
                    url: `/pdfs/${filename}`
                });
            });
            stream.on('error', reject);
        });
    }

    // ==========================================
    // BANDEAU DE TITRE REUTILISABLE
    // ==========================================
    static _dessinerBandeau(doc, titre, hauteur) {
        const gradient = doc.linearGradient(0, 0, doc.page.width, 0);
        gradient.stop(0, COLORS.primary);
        gradient.stop(1, COLORS.secondary);
        doc.rect(0, 0, doc.page.width, hauteur).fill(gradient);
        doc.rect(0, hauteur - 3, doc.page.width, 3).fill(COLORS.accent);

        const centreY = hauteur / 2;

        doc.fillColor(COLORS.white)
           .font('Helvetica-Bold')
           .fontSize(hauteur > 100 ? 24 : 18)
           .text(titre, 50, hauteur > 100 ? 34 : centreY - 9, {
               width: doc.page.width - 100,
               align: 'center'
           });
    }

    // ==========================================
    // ICONES VECTORIELLES
    // ==========================================
    static _iconeLivre(doc, x, y, color, taille = 8) {
        doc.save();
        doc.rect(x - taille, y - taille * 0.7, taille * 2, taille * 1.4)
           .lineWidth(1.2)
           .stroke(color);
        doc.moveTo(x, y - taille * 0.7).lineTo(x, y + taille * 0.7).stroke(color);
        doc.restore();
    }

    static _iconeHorloge(doc, x, y, color, taille = 7) {
        doc.save();
        doc.circle(x, y, taille).lineWidth(1.2).stroke(color);
        doc.moveTo(x, y).lineTo(x, y - taille * 0.6).stroke(color);
        doc.moveTo(x, y).lineTo(x + taille * 0.45, y).stroke(color);
        doc.restore();
    }

    static _iconeEtoile(doc, x, y, color, taille = 6) {
        doc.save();
        const points = [];
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? taille : taille * 0.42;
            const angle = (Math.PI / 5) * i - Math.PI / 2;
            points.push([x + r * Math.cos(angle), y + r * Math.sin(angle)]);
        }
        doc.polygon(...points).fill(color);
        doc.restore();
    }

    static _iconeCoche(doc, x, y, color, taille = 7) {
        doc.save();
        doc.circle(x, y, taille).fill(color);
        doc.lineWidth(1.4).strokeColor(COLORS.white);
        doc.moveTo(x - taille * 0.45, y).lineTo(x - taille * 0.1, y + taille * 0.4)
           .lineTo(x + taille * 0.5, y - taille * 0.4).stroke();
        doc.restore();
    }

    static _iconeCible(doc, x, y, color, taille = 7) {
        doc.save();
        doc.circle(x, y, taille).lineWidth(1.2).stroke(color);
        doc.circle(x, y, taille * 0.55).lineWidth(1.2).stroke(color);
        doc.circle(x, y, taille * 0.15).fill(color);
        doc.restore();
    }

    static _iconeAlerte(doc, x, y, color, taille = 7) {
        doc.save();
        doc.polygon(
            [x, y - taille],
            [x + taille * 0.95, y + taille * 0.7],
            [x - taille * 0.95, y + taille * 0.7]
        ).lineWidth(1.2).stroke(color);
        doc.circle(x, y + taille * 0.35, 0.9).fill(color);
        doc.rect(x - 0.6, y - taille * 0.35, 1.2, taille * 0.55).fill(color);
        doc.restore();
    }

    static _iconePersonne(doc, x, y, color, taille = 7) {
        doc.save();
        doc.circle(x, y - taille * 0.5, taille * 0.4).fill(color);
        doc.moveTo(x - taille * 0.7, y + taille * 0.7)
           .quadraticCurveTo(x, y - taille * 0.1, x + taille * 0.7, y + taille * 0.7)
           .fill(color);
        doc.restore();
    }

    // ==========================================
    // ICONE ENVELOPPE (remplace l'emoji email)
    // ==========================================
    static _iconeEnveloppe(doc, x, y, color, taille = 6) {
        doc.save();
        doc.rect(x - taille, y - taille * 0.7, taille * 2, taille * 1.4)
           .lineWidth(1.1)
           .stroke(color);
        doc.moveTo(x - taille, y - taille * 0.7)
           .lineTo(x, y + taille * 0.15)
           .lineTo(x + taille, y - taille * 0.7)
           .stroke(color);
        doc.restore();
    }

    // ==========================================
    // PAGE 1 : COUVERTURE + STATISTIQUES AVEC INFOS ELEVE
    // ==========================================
    static _page1(doc, utilisateur, plan, emplois, taches) {
        this._dessinerBandeau(doc, 'Mon Planning Intelligent', 100);

        doc.font('Helvetica').fontSize(12).fillColor('#C7D0E8')
           .text('Organisation hebdomadaire optimisee', 50, 62, {
               width: doc.page.width - 100,
               align: 'center'
           });

        // ==========================================
        // INFOS ELEVE (NOM, CLASSE, SERIE, EMAIL)
        // ==========================================
        const cardY = 100;
        doc.roundedRect(50, cardY, doc.page.width - 100, 90, 6)
           .fillAndStroke(COLORS.lightGray, COLORS.border);

        this._iconePersonne(doc, 72, cardY + 45, COLORS.primary, 9);

        doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(13)
           .text("INFORMATIONS DE L'ELEVE", 95, cardY + 12);

        doc.font('Helvetica').fontSize(11).fillColor(COLORS.dark)
           .text(`Nom : ${nettoyerTexte(utilisateur.nom) || 'Non renseigne'}`, 95, cardY + 35)
           .text(`Classe : ${nettoyerTexte(utilisateur.classe) || 'Non specifiee'}`, 95, cardY + 55)
           .text(`Serie : ${nettoyerTexte(utilisateur.serie) || 'Non specifiee'}`, 350, cardY + 35);

        // Ligne Email avec icone vectorielle (au lieu d'un emoji)
        this._iconeEnveloppe(doc, 358, cardY + 60, COLORS.gray, 5);
        doc.font('Helvetica').fontSize(11).fillColor(COLORS.dark)
           .text(`Email : ${nettoyerTexte(utilisateur.email) || 'Non renseigne'}`, 370, cardY + 55);

        // --- Statistiques en cartes ---
        const totalCours = emplois.length;
        const totalTaches = taches.length;
        const tachesPlanifiees = plan.length;
        const heuresCours = emplois.reduce((sum, e) => sum + (e.heure_fin - e.heure_debut), 0);
        const tauxOptim = totalTaches > 0 ? Math.round((tachesPlanifiees / totalTaches) * 100) : 0;

        const stats = [
            { label: 'Cours', value: String(totalCours), color: COLORS.primary, icone: this._iconeLivre },
            { label: 'Taches', value: String(totalTaches), color: COLORS.gold, icone: this._iconeCoche },
            { label: 'Heures', value: `${heuresCours} h`, color: COLORS.green, icone: this._iconeHorloge },
            { label: 'Optimisation', value: `${tauxOptim} %`, color: COLORS.accent, icone: this._iconeCible }
        ];

        let xPos = 50;
        const cardWidth = (doc.page.width - 80 - 30) / 4;
        const cardHeight = 84;
        const statsY = cardY + 105;

        for (const stat of stats) {
            doc.roundedRect(xPos, statsY, cardWidth, cardHeight, 6)
               .fillAndStroke(COLORS.white, COLORS.border);
            doc.rect(xPos, statsY, cardWidth, 4).fill(stat.color);

            stat.icone.call(this, doc, xPos + cardWidth / 2, statsY + 26, stat.color, 9);

            doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(20)
               .text(stat.value, xPos, statsY + 40, { width: cardWidth, align: 'center' });

            doc.fillColor(COLORS.gray).font('Helvetica').fontSize(9)
               .text(stat.label.toUpperCase(), xPos, statsY + 64, { width: cardWidth, align: 'center' });

            xPos += cardWidth + 10;
        }

        // --- Barre de progression ---
        const progressY = statsY + cardHeight + 30;
        doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(12)
           .text("Taux d'optimisation du planning", 50, progressY);

        const barWidth = doc.page.width - 100;
        doc.roundedRect(50, progressY + 20, barWidth, 18, 9).fill(COLORS.lightGray);

        const filledWidth = Math.max((barWidth * tauxOptim) / 100, tauxOptim > 0 ? 18 : 0);
        if (filledWidth > 0) {
            doc.roundedRect(50, progressY + 20, filledWidth, 18, 9).fill(COLORS.accent);
        }
        doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(9)
           .text(`${tauxOptim} %`, 50, progressY + 43);

        // --- Repartition par type (barre segmentee) ---
        const typeY = progressY + 75;
        const types = ['etude', 'domestique', 'personnel'];
        const typeCounts = types.map(t => taches.filter(x => x.type === t).length);
        const total = typeCounts.reduce((a, b) => a + b, 0) || 1;

        doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(12)
           .text('Repartition des taches par type', 50, typeY);

        let typeX = 50;
        const segY = typeY + 24;
        const segHeight = 26;
        const totalWidth = doc.page.width - 100;

        for (const type of types) {
            const meta = TYPE_META[type];
            const count = taches.filter(x => x.type === type).length;
            const width = Math.max((totalWidth * count) / total, count > 0 ? 40 : 0);
            if (width === 0) continue;

            doc.rect(typeX, segY, width, segHeight).fill(meta.color);
            doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(9)
               .text(`${meta.label} (${count})`, typeX + 8, segY + 9, { width: width - 16 });

            typeX += width + 3;
        }

        // --- Legende ---
        let legendX = 50;
        const legendY = segY + segHeight + 14;
        for (const type of types) {
            const meta = TYPE_META[type];
            doc.circle(legendX + 4, legendY + 4, 4).fill(meta.color);
            doc.fillColor(COLORS.gray).font('Helvetica').fontSize(9)
               .text(meta.label, legendX + 14, legendY);
            legendX += 110;
        }
    }

    // ==========================================
    // PAGE 2 : PLANNING DE LA SEMAINE
    // ==========================================
    static _page2(doc, plan, emplois) {
        doc.addPage();
        this._dessinerBandeau(doc, 'Planning de la semaine', 60);

        const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        const joursFr = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        let yPos = 82;
        let aAfficheAuMoinsUnJour = false;

        for (let i = 0; i < jours.length; i++) {
            const jour = jours[i];
            const coursJour = emplois.filter(e => e.jour === jour).sort((a, b) => a.heure_debut - b.heure_debut);
            const tachesJour = plan.filter(p => p.jour === jour).sort((a, b) => a.heure_debut - b.heure_debut);

            if (coursJour.length === 0 && tachesJour.length === 0) continue;
            aAfficheAuMoinsUnJour = true;

            yPos = this._verifierSautDePage(doc, yPos, 66);

            doc.roundedRect(50, yPos, doc.page.width - 100, 26, 5).fill(COLORS.primary);
            doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(12)
               .text(joursFr[i].toUpperCase(), 62, yPos + 7);

            const nbTotal = coursJour.length + tachesJour.length;
            doc.font('Helvetica').fontSize(9)
               .text(`${nbTotal} activite(s)`, doc.page.width - 150, yPos + 8, { width: 90, align: 'right' });

            yPos += 34;

            for (const cours of coursJour) {
                yPos = this._verifierSautDePage(doc, yPos, 24);
                doc.roundedRect(60, yPos, doc.page.width - 120, 22, 4).fill(COLORS.primaryLight);
                this._iconeLivre(doc, 74, yPos + 11, COLORS.primary, 6);
                doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(9)
                   .text('COURS', 88, yPos + 6, { width: 55 });
                doc.fillColor(COLORS.dark).font('Helvetica').fontSize(10.5)
                   .text(nettoyerTexte(cours.matiere), 150, yPos + 6, { width: 260 });
                doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.primary)
                   .text(`${cours.heure_debut}h - ${cours.heure_fin}h`, doc.page.width - 170, yPos + 6, {
                       width: 110, align: 'right'
                   });
                yPos += 26;
            }

            for (const tache of tachesJour) {
                yPos = this._verifierSautDePage(doc, yPos, 24);
                const meta = TYPE_META[tache.type] || { label: 'TACHE', color: COLORS.gray, fond: COLORS.lightGray };

                doc.roundedRect(60, yPos, doc.page.width - 120, 22, 4).fill(meta.fond);
                doc.circle(74, yPos + 11, 4).fill(meta.color);
                doc.fillColor(meta.color).font('Helvetica-Bold').fontSize(8.5)
                   .text(meta.label, 88, yPos + 6, { width: 70 });
                doc.fillColor(COLORS.dark).font('Helvetica').fontSize(10)
                   .text(nettoyerTexte(tache.tache), 165, yPos + 6, { width: 210 });

                const horaireX = doc.page.width - 170;
                doc.font('Helvetica-Bold').fontSize(10).fillColor(meta.color)
                   .text(`${tache.heure_debut}h - ${tache.heure_fin}h`, horaireX, yPos + 6, {
                       width: 75, align: 'right'
                   });
                this._iconeEtoile(doc, horaireX + 85, yPos + 11, COLORS.gold, 5);
                doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.dark)
                   .text(String(tache.priorite), horaireX + 92, yPos + 7);

                yPos += 26;
            }

            yPos += 12;
        }

        if (!aAfficheAuMoinsUnJour) {
            doc.fillColor(COLORS.gray).font('Helvetica').fontSize(11)
               .text('Aucun cours ni tache planifiee pour cette semaine.', 50, yPos);
        }
    }

    // ==========================================
    // PAGE 3 : RECOMMANDATIONS
    // ==========================================
    static _page3(doc, utilisateur, plan, emplois, taches) {
        doc.addPage();
        this._dessinerBandeau(doc, 'Recommandations personnalisees', 60);

        let yPos = 82;

        const heuresCours = emplois.reduce((sum, e) => sum + (e.heure_fin - e.heure_debut), 0);
        const totalTaches = taches.length;
        const tachesPlanifiees = plan.length;
        const recs = [];

        if (heuresCours < 20) {
            recs.push({
                icone: this._iconeLivre,
                couleur: COLORS.primary,
                fond: COLORS.primaryLight,
                titre: 'Temps de cours reduit',
                desc: `Vous avez ${heuresCours} h de cours cette semaine. Profitez de ce temps libre pour approfondir vos revisions.`,
                action: "Ajoutez 30 min d'etude par jour"
            });
        }

        if (totalTaches > 10 && tachesPlanifiees < totalTaches * 0.7) {
            recs.push({
                icone: this._iconeAlerte,
                couleur: COLORS.accent,
                fond: COLORS.accentLight,
                titre: 'Taches non planifiees',
                desc: `${totalTaches - tachesPlanifiees} taches ne sont pas encore planifiees.`,
                action: 'Liberez du temps ou reduisez la duree des taches'
            });
        }

        if (tachesPlanifiees > 5) {
            recs.push({
                icone: this._iconeCible,
                couleur: COLORS.green,
                fond: COLORS.greenLight,
                titre: 'Bon rythme de travail',
                desc: `Vous avez ${tachesPlanifiees} taches planifiees. Continuez sur cette lancee !`,
                action: 'Maintenez ce rythme pour progresser'
            });
        }

        if (recs.length === 0) {
            recs.push({
                icone: this._iconeEtoile,
                couleur: COLORS.gold,
                fond: COLORS.goldLight,
                titre: 'Organisation exemplaire',
                desc: 'Votre planning est bien equilibre. Continuez ainsi !',
                action: 'Partagez votre methode avec vos camarades'
            });
        }

        for (const rec of recs) {
            yPos = this._verifierSautDePage(doc, yPos, 94, 82);

            doc.roundedRect(50, yPos, doc.page.width - 100, 84, 6)
               .fillAndStroke(rec.fond, COLORS.border);
            doc.roundedRect(50, yPos, 5, 84, 2.5).fill(rec.couleur);

            rec.icone.call(this, doc, 82, yPos + 42, rec.couleur, 11);

            doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(13)
               .text(rec.titre, 112, yPos + 14);

            doc.fillColor(COLORS.gray).font('Helvetica').fontSize(10)
               .text(rec.desc, 112, yPos + 34, { width: doc.page.width - 180 });

            doc.fillColor(rec.couleur).font('Helvetica-Bold').fontSize(9.5)
               .text(rec.action, 112, yPos + 62, { width: doc.page.width - 180 });

            yPos += 96;
        }

        // --- Citation de motivation ---
        yPos = this._verifierSautDePage(doc, yPos, 70, 82);

        const citations = [
            "L'organisation est la cle de la reussite.",
            'Le succes est la somme de petits efforts repetes.',
            'La discipline est la mere du succes.',
            'Un bon planning est la moitie du travail accompli.'
        ];
        const citation = citations[Math.floor(Math.random() * citations.length)];

        doc.roundedRect(50, yPos, doc.page.width - 100, 60, 6).fill(COLORS.secondary);
        doc.fillColor(COLORS.gold).font('Helvetica-Oblique').fontSize(14)
           .text(`" ${citation} "`, 70, yPos + 22, {
               width: doc.page.width - 140,
               align: 'center'
           });
    }

    // ==========================================
    // PIED DE PAGE (toutes les pages)
    // ==========================================
    static _footer(doc) {
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);

            doc.moveTo(50, doc.page.height - 40)
               .lineTo(doc.page.width - 50, doc.page.height - 40)
               .lineWidth(0.75)
               .stroke(COLORS.border);

            doc.fillColor(COLORS.gray).font('Helvetica').fontSize(8)
               .text('Mon Planning Intelligent', 50, doc.page.height - 28, { width: 250 });

            doc.font('Helvetica').fontSize(8).fillColor(COLORS.gray)
               .text(`Page ${i + 1} / ${range.count}`, doc.page.width - 150, doc.page.height - 28, {
                   width: 100,
                   align: 'right'
               });
        }
    }

    // ==========================================
    // GESTION DES SAUTS DE PAGE
    // ==========================================
    static _verifierSautDePage(doc, yPos, espaceRequis, entete = 50) {
        const limite = doc.page.height - 55;
        if (yPos + espaceRequis > limite) {
            doc.addPage();
            return entete;
        }
        return yPos;
    }
}

module.exports = PDFGenerator;