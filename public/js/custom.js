function yesnoCheck(that) {
    if (that.value == "recurring") {
        document.getElementById("sec").style.display = "block";

    } else if(that.value =="weekly" ){
      document.getElementById("sec").style.display = "none";
      document.getElementById("day_m").style.display = "none";
      document.getElementById("month").style.display = "none";
      document.getElementById("time_h").style.display = "block";
      document.getElementById("time_m").style.display = "block";
      document.getElementById("day_w").style.display = "block";
    }else if(that.value =="monthly" ){
      document.getElementById("sec").style.display = "none";
      document.getElementById("month").style.display = "none";
      document.getElementById("day_w").style.display = "none";
      document.getElementById("time_h").style.display = "block";
      document.getElementById("time_m").style.display = "block";
      document.getElementById("day_m").style.display = "block";
    }else if(that.value =="yearly" ){
      document.getElementById("sec").style.display = "none";
      document.getElementById("day_w").style.display = "none";
      document.getElementById("time_h").style.display = "block";
      document.getElementById("time_m").style.display = "block";
      document.getElementById("day_m").style.display = "block";
      document.getElementById("month").style.display = "block";
    }
}
